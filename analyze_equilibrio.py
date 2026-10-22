"""Analisa as fases estática e dinâmica exportadas pelo app móvel."""

from __future__ import annotations

import argparse
import re
import unicodedata
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.signal import butter, sosfiltfilt

TIME_COLUMN = "Tempo (ms)"
SIGNAL_COLUMNS = ("Giroscópio X", "Giroscópio Y", "Giroscópio Z")
PHASE_COLUMN = "Fase"
STATIC_PHASE = "Estatico"
DYNAMIC_PHASE = "Dinamico"
CUTOFF_HZ = 5.0
FILTER_ORDER = 4

COLUMN_ALIASES = {
    TIME_COLUMN: {"tempo ms", "tempo 50ms"},
    SIGNAL_COLUMNS[0]: {"giroscopio x"},
    SIGNAL_COLUMNS[1]: {"giroscopio y"},
    SIGNAL_COLUMNS[2]: {"giroscopio z"},
    PHASE_COLUMN: {"fase"},
}


def normalize_text(value: object) -> str:
    """Normaliza acentos e separadores para comparar cabeçalhos e fases."""
    ascii_text = (
        unicodedata.normalize("NFKD", str(value))
        .encode("ascii", errors="ignore")
        .decode("ascii")
    )
    return re.sub(r"[^a-z0-9]+", " ", ascii_text.casefold()).strip()


def load_measurements(excel_path: Path) -> pd.DataFrame:
    """Carrega e valida as colunas e os valores necessários da planilha."""
    if not excel_path.is_file():
        raise FileNotFoundError(f"Arquivo não encontrado: {excel_path}")

    source = pd.read_excel(excel_path, engine="openpyxl")
    normalized_headers: dict[str, list[object]] = {}
    for column in source.columns:
        normalized_headers.setdefault(normalize_text(column), []).append(column)

    rename: dict[object, str] = {}
    missing: list[str] = []
    for canonical, aliases in COLUMN_ALIASES.items():
        matches = [
            column
            for alias in aliases
            for column in normalized_headers.get(alias, [])
        ]
        if not matches:
            missing.append(canonical)
        elif len(matches) > 1:
            raise ValueError(
                f"A planilha contém mais de uma coluna correspondente a "
                f"'{canonical}': {matches}"
            )
        else:
            rename[matches[0]] = canonical

    if missing:
        raise ValueError(
            "A planilha não contém as colunas obrigatórias: "
            + ", ".join(missing)
        )

    data = source.rename(columns=rename)[
        [TIME_COLUMN, *SIGNAL_COLUMNS, PHASE_COLUMN]
    ].copy()

    numeric_columns = [TIME_COLUMN, *SIGNAL_COLUMNS]
    for column in numeric_columns:
        data[column] = pd.to_numeric(data[column], errors="coerce")

    numeric_values = data[numeric_columns].to_numpy(dtype=float)
    invalid_rows = ~np.isfinite(numeric_values).all(axis=1)
    if invalid_rows.any():
        excel_rows = (data.index[invalid_rows] + 2).tolist()
        raise ValueError(
            "Há tempos ou leituras ausentes/não numéricos nas linhas do Excel: "
            f"{excel_rows[:10]}"
        )

    phase_map = {
        "estatico": STATIC_PHASE,
        "dinamico": DYNAMIC_PHASE,
    }
    normalized_phases = data[PHASE_COLUMN].map(normalize_text)
    invalid_phases = ~normalized_phases.isin(phase_map)
    if invalid_phases.any():
        values = data.loc[invalid_phases, PHASE_COLUMN].drop_duplicates().tolist()
        raise ValueError(
            "A coluna 'Fase' deve conter apenas 'Estatico' e 'Dinamico'. "
            f"Valores inválidos: {values}"
        )
    data[PHASE_COLUMN] = normalized_phases.map(phase_map)

    elapsed_ms = data[TIME_COLUMN].to_numpy(dtype=float)
    if len(data) < 2 or np.any(np.diff(elapsed_ms) <= 0):
        raise ValueError(
            "A coluna 'Tempo (ms)' deve conter pelo menos duas leituras "
            "em ordem estritamente crescente."
        )

    if STATIC_PHASE not in data[PHASE_COLUMN].values:
        raise ValueError("A planilha não contém leituras da fase 'Estatico'.")
    if DYNAMIC_PHASE not in data[PHASE_COLUMN].values:
        raise ValueError("A planilha não contém leituras da fase 'Dinamico'.")

    first_dynamic = data[PHASE_COLUMN].eq(DYNAMIC_PHASE).to_numpy().argmax()
    if data[PHASE_COLUMN].iloc[first_dynamic:].eq(STATIC_PHASE).any():
        raise ValueError(
            "As fases devem estar em ordem: primeiro 'Estatico', depois "
            "'Dinamico'."
        )

    return data


def calibrate_and_filter(
    data: pd.DataFrame,
) -> tuple[pd.DataFrame, dict[str, float], float]:
    """Remove o offset estático e aplica filtro Butterworth passa-baixa."""
    static_data = data.loc[data[PHASE_COLUMN].eq(STATIC_PHASE)]
    offsets = static_data[list(SIGNAL_COLUMNS)].mean().to_dict()

    elapsed_ms = data[TIME_COLUMN].to_numpy(dtype=float)
    sample_rate_hz = 1000.0 / float(np.median(np.diff(elapsed_ms)))
    if sample_rate_hz <= 2 * CUTOFF_HZ:
        raise ValueError(
            f"A frequência estimada ({sample_rate_hz:.2f} Hz) precisa ser "
            f"maior que {2 * CUTOFF_HZ:.1f} Hz para um corte de {CUTOFF_HZ:g} Hz."
        )

    sos = butter(
        FILTER_ORDER,
        CUTOFF_HZ,
        btype="lowpass",
        fs=sample_rate_hz,
        output="sos",
    )
    pad_length = 3 * (
        2 * len(sos)
        + 1
        - min(int((sos[:, 2] == 0).sum()), int((sos[:, 5] == 0).sum()))
    )
    if len(data) <= pad_length:
        raise ValueError(
            f"A filtragem requer mais de {pad_length} leituras; "
            f"a planilha contém {len(data)}."
        )

    filtered = data.copy()
    for column in SIGNAL_COLUMNS:
        calibrated = data[column].to_numpy(dtype=float) - offsets[column]
        filtered[column] = sosfiltfilt(sos, calibrated)

    return filtered, offsets, sample_rate_hz


def save_plots(data: pd.DataFrame, output_dir: Path) -> tuple[Path, Path]:
    """Salva a série temporal dos eixos e o estabilograma X por Y."""
    output_dir.mkdir(parents=True, exist_ok=True)

    time_seconds = data[TIME_COLUMN].to_numpy(dtype=float) / 1000.0
    dynamic_start_ms = float(
        data.loc[data[PHASE_COLUMN].eq(DYNAMIC_PHASE), TIME_COLUMN].iloc[0]
    )
    dynamic_start_seconds = dynamic_start_ms / 1000.0

    time_plot_path = output_dir / "series_temporais.png"
    figure, axis = plt.subplots(figsize=(12, 6))
    for column, color in zip(SIGNAL_COLUMNS, ("#1565C0", "#2E7D32", "#EF6C00")):
        axis.plot(time_seconds, data[column], color=color, label=column)
    axis.axvline(
        dynamic_start_seconds,
        color="#424242",
        linestyle="--",
        linewidth=1.5,
        label="Início da fase dinâmica",
    )
    axis.set(
        title="Movimentação cervical — giroscópio calibrado e filtrado",
        xlabel="Tempo decorrido (s)",
        ylabel="Velocidade angular (rad/s)",
    )
    axis.grid(True, alpha=0.25)
    axis.legend()
    figure.tight_layout()
    figure.savefig(time_plot_path, dpi=200)
    plt.close(figure)

    stabilogram_path = output_dir / "estabilograma.png"
    figure, axis = plt.subplots(figsize=(8, 8))
    static_data = data.loc[data[PHASE_COLUMN].eq(STATIC_PHASE)]
    dynamic_data = data.loc[data[PHASE_COLUMN].eq(DYNAMIC_PHASE)]
    axis.scatter(
        static_data[SIGNAL_COLUMNS[0]],
        static_data[SIGNAL_COLUMNS[1]],
        color="blue",
        alpha=0.6,
        s=14,
        label="Estático",
    )
    axis.scatter(
        dynamic_data[SIGNAL_COLUMNS[0]],
        dynamic_data[SIGNAL_COLUMNS[1]],
        color="red",
        alpha=0.6,
        s=14,
        label="Dinâmico",
    )
    axis.set(
        title="Estabilograma — giroscópio X × Y",
        xlabel="Giroscópio X filtrado (rad/s)",
        ylabel="Giroscópio Y filtrado (rad/s)",
    )
    axis.set_aspect("equal", adjustable="datalim")
    axis.grid(True, alpha=0.25)
    axis.legend()
    figure.tight_layout()
    figure.savefig(stabilogram_path, dpi=200)
    plt.close(figure)

    return time_plot_path, stabilogram_path


def analyze(excel_path: Path, output_dir: Path | None = None) -> tuple[Path, Path]:
    """Executa a análise completa e retorna os caminhos das figuras."""
    data = load_measurements(excel_path)
    static_data = data.loc[data[PHASE_COLUMN].eq(STATIC_PHASE)].copy()
    dynamic_data = data.loc[data[PHASE_COLUMN].eq(DYNAMIC_PHASE)].copy()

    filtered_data, offsets, sample_rate_hz = calibrate_and_filter(data)
    filtered_static = filtered_data.loc[
        filtered_data[PHASE_COLUMN].eq(STATIC_PHASE)
    ].copy()
    filtered_dynamic = filtered_data.loc[
        filtered_data[PHASE_COLUMN].eq(DYNAMIC_PHASE)
    ].copy()

    destination = output_dir or excel_path.parent / "analise_equilibrio"
    paths = save_plots(filtered_data, destination)

    print(f"Leituras estáticas: {len(static_data)}")
    print(f"Leituras dinâmicas: {len(dynamic_data)}")
    print(f"Frequência de amostragem estimada: {sample_rate_hz:.2f} Hz")
    print(f"Offsets removidos (rad/s): {offsets}")
    print(f"DataFrames preparados: {len(filtered_static)} estáticas, "
          f"{len(filtered_dynamic)} dinâmicas")
    print(f"Gráficos salvos em: {paths[0]} e {paths[1]}")

    return paths


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analisa e plota as fases estática e dinâmica de uma avaliação."
    )
    parser.add_argument(
        "arquivo_excel",
        type=Path,
        help="Arquivo .xlsx exportado pelo aplicativo.",
    )
    parser.add_argument(
        "--saida",
        type=Path,
        default=None,
        help="Diretório de saída das imagens (padrão: ./analise_equilibrio ao lado do arquivo).",
    )
    args = parser.parse_args()
    analyze(args.arquivo_excel, args.saida)


if __name__ == "__main__":
    main()
