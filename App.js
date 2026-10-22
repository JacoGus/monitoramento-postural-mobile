import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Gyroscope } from 'expo-sensors';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import * as XLSX from 'xlsx';

const UPDATE_INTERVAL_MS = 50;
const STATIC_PHASE_DURATION_MS = 5000;
const CHART_WIDTH = 360;
const SERIES_CHART_HEIGHT = 250;
const SCATTER_CHART_HEIGHT = 280;
const SERIES_COLORS = ['#1565C0', '#00897B', '#EF6C00'];
const STATIC_COLOR = '#1565C0';
const DYNAMIC_COLOR = '#D32F2F';
const BEEP_WAV_BASE64 =
  'UklGRiQFAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAFAAAAAG0R3Br2FxAKjffq6ODkSe1J/hIQfBq9GKQLNPnh6bbkEuyT/KYOARpsGSwN4frv6qjk7+rh+iwNbBkBGqYOk/wS7Lbk4ek0+aQLvRh8GhIQSf5J7eDk6uiN9xAK9hfcGm0RAACT7iTlCujw9XMIFhcgG7cStwHu74TlQ+dc9MwGHxZKG+4TbQNa8f/llObU8h8FERVYGxEVHwXU8pTm/+Va8W0D7hNKGx8WzAZc9EPnhOXu77cBtxIgGxYXcwjw9QroJOWT7gAAbRHcGvYXEAqN9+ro4ORJ7Un+EhB8Gr0YpAs0+eHptuQS7JP8pg4BGmwZLA3h+u/qqOTv6uH6LA1sGQEapg6T/BLstuTh6TT5pAu9GHwaEhBJ/knt4OTq6I33EAr2F9wabREAAJPuJOUK6PD1cwgWFyAbtxK3Ae7vhOVD51z0zAYfFkob7hNtA1rx/+WU5tTyHwURFVgbERUfBdTylOb/5VrxbQPuE0obHxbMBlz0Q+eE5e7vtwG3EiAbFhdzCPD1Cugk5ZPuAABtEdwa9hcQCo336ujg5EntSf4SEHwavRikCzT54em25BLsk/ymDgEabBksDeH67+qo5O/q4fosDWwZARqmDpP8Euy25OHpNPmkC70YfBoSEEn+Se3g5OrojfcQCvYX3BptEQAAk+4k5Qro8PVzCBYXIBu3ErcB7u+E5UPnXPTMBh8WShvuE20DWvH/5ZTm1PIfBREVWBsRFR8F1PKU5v/lWvFtA+4TShsfFswGXPRD54Tl7u+3AbcSIBsWF3MI8PUK6CTlk+4AAG0R3Br2FxAKjffq6ODkSe1J/hIQfBq9GKQLNPnh6bbkEuyT/KYOARpsGSwN4frv6qjk7+rh+iwNbBkBGqYOk/wS7Lbk4ek0+aQLvRh8GhIQSf5J7eDk6uiN9xAK9hfcGm0RAACT7iTlCujw9XMIFhcgG7cStwHu74TlQ+dc9MwGHxZKG+4TbQNa8f/llObU8h8FERVYGxEVHwXU8pTm/+Va8W0D7hNKGx8WzAZc9EPnhOXu77cBtxIgGxYXcwjw9QroJOWT7gAAbRHcGvYXEAqN9+ro4ORJ7Un+EhB8Gr0YpAs0+eHptuQS7JP8pg4BGmwZLA3h+u/qqOTv6uH6LA1sGQEapg6T/BLstuTh6TT5pAu9GHwaEhBJ/knt4OTq6I33EAr2F9wabREAAJPuJOUK6PD1cwgWFyAbtxK3Ae7vhOVD51z0zAYfFkob7hNtA1rx/+WU5tTyHwURFVgbERUfBdTylOb/5VrxbQPuE0obHxbMBlz0Q+eE5e7vtwG3EiAbFhdzCPD1Cugk5ZPuAABtEdwa9hcQCo336ujg5EntSf4SEHwavRikCzT54em25BLsk/ymDgEabBksDeH67+qo5O/q4fosDWwZARqmDpP8Euy25OHpNPmkC70YfBoSEEn+Se3g5OrojfcQCvYX3BptEQAAk+4k5Qro8PVzCBYXIBu3ErcB7u+E5UPnXPTMBh8WShvuE20DWvH/5ZTm1PIfBREVWBsRFR8F1PKU5v/lWvFtA+4TShsfFswGXPRD54Tl7u+3AbcSIBsWF3MI8PUK6CTlk+4AAG0R3Br2FxAKjffq6ODkSe1J/hIQfBq9GKQLNPnh6bbkEuyT/KYOARpsGSwN4frv6qjk7+rh+iwNbBkBGqYOk/wS7Lbk4ek0+aQLvRh8Gg==';

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const downsample = (readings, maximumPoints = 400) => {
  if (readings.length <= maximumPoints) return readings;
  const stride = Math.ceil((readings.length - 1) / (maximumPoints - 1));
  const sampled = readings.filter((_, index) => index % stride === 0);
  if (sampled[sampled.length - 1] !== readings[readings.length - 1]) {
    sampled.push(readings[readings.length - 1]);
  }
  return sampled;
};

const getPaddedDomain = (values) => {
  const { minimum, maximum } = values.reduce(
    (domain, value) => ({
      minimum: Math.min(domain.minimum, value),
      maximum: Math.max(domain.maximum, value),
    }),
    { minimum: Infinity, maximum: -Infinity }
  );
  const padding = maximum === minimum ? Math.abs(maximum) * 0.1 || 0.1 : (maximum - minimum) * 0.08;
  return [minimum - padding, maximum + padding];
};

const formatChartValue = (value) => Number(value.toFixed(2)).toString();

const getStaticOffsets = (readings) => {
  const staticReadings = readings.filter((reading) => reading.phase === 'Estatico');
  const source = staticReadings.length > 0 ? staticReadings : readings;
  if (source.length === 0) return { x: 0, y: 0, z: 0 };
  return ['x', 'y', 'z'].reduce(
    (offsets, axis) => ({
      ...offsets,
      [axis]:
        source.reduce((sum, reading) => sum + reading[axis], 0) / source.length,
    }),
    {}
  );
};

function TimeSeriesChart({ readings, offsets }) {
  const points = downsample(readings);
  if (points.length < 2) {
    return <Text style={styles.chartEmpty}>Dados insuficientes para o gráfico.</Text>;
  }

  const left = 58;
  const right = 348;
  const top = 20;
  const bottom = 198;
  const duration = Math.max(points[points.length - 1].elapsedMs, 1);
  const allValues = points.flatMap((reading) => [
    reading.x - offsets.x,
    reading.y - offsets.y,
    reading.z - offsets.z,
  ]);
  const [minimum, maximum] = getPaddedDomain(allValues);
  const xPosition = (elapsedMs) => left + (elapsedMs / duration) * (right - left);
  const yPosition = (value) =>
    bottom - ((value - minimum) / (maximum - minimum)) * (bottom - top);
  const axes = ['x', 'y', 'z'];
  const dynamicStart =
    readings.find((reading) => reading.phase === 'Dinamico')?.elapsedMs ??
    STATIC_PHASE_DURATION_MS;
  const dividerX = Math.min(right, Math.max(left, xPosition(dynamicStart)));

  const series = axes.map((axis) => ({
    axis,
    path: points
      .map((reading, index) => {
        const x = xPosition(reading.elapsedMs);
        const y = yPosition(reading[axis] - offsets[axis]);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' '),
  }));

  return (
    <View accessible accessibilityLabel="Gráfico de linha dos três eixos ao longo do tempo">
      <Svg width="100%" height={SERIES_CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${SERIES_CHART_HEIGHT}`}>
        <Rect x={left} y={top} width={Math.max(0, dividerX - left)} height={bottom - top} fill="#EAF2FB" />
        <Rect x={dividerX} y={top} width={Math.max(0, right - dividerX)} height={bottom - top} fill="#FCEEEE" />
        {[0, 1, 2, 3, 4].map((index) => {
          const y = top + (index / 4) * (bottom - top);
          const value = maximum - (index / 4) * (maximum - minimum);
          return (
            <React.Fragment key={`y-grid-${index}`}>
              <Line x1={left} y1={y} x2={right} y2={y} stroke="#D5DDD8" strokeWidth={1} />
              <SvgText x={left - 7} y={y + 4} textAnchor="end" fontSize={10} fill="#52645C">
                {formatChartValue(value)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {[0, 1, 2, 3, 4].map((index) => {
          const x = left + (index / 4) * (right - left);
          return (
            <React.Fragment key={`x-grid-${index}`}>
              <Line x1={x} y1={top} x2={x} y2={bottom} stroke="#E3E9E5" strokeWidth={1} />
              <SvgText x={x} y={bottom + 17} textAnchor="middle" fontSize={10} fill="#52645C">
                {((duration / 1000) * index / 4).toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Line
          x1={dividerX}
          y1={top}
          x2={dividerX}
          y2={bottom}
          stroke="#263D34"
          strokeWidth={2}
          strokeDasharray="5,4"
        />
        {series.map(({ axis, path }, index) => (
          <Path
            key={axis}
            d={path}
            fill="none"
            stroke={SERIES_COLORS[index]}
            strokeWidth={1.8}
          />
        ))}
        <SvgText x={(left + right) / 2} y={SERIES_CHART_HEIGHT - 7} textAnchor="middle" fontSize={11} fill="#263D34">
          Tempo (s)
        </SvgText>
        <SvgText
          x={13}
          y={(top + bottom) / 2}
          textAnchor="middle"
          fontSize={10}
          fill="#263D34"
          rotation="-90"
          origin={`13,${(top + bottom) / 2}`}
        >
          rad/s (offset removido)
        </SvgText>
      </Svg>
      <View style={styles.phaseLegend}>
        <Text style={[styles.phaseLegendText, { color: STATIC_COLOR }]}>
          ■ Estático
        </Text>
        <Text style={[styles.phaseLegendText, { color: DYNAMIC_COLOR }]}>
          ■ Dinâmico
        </Text>
        <Text style={styles.phaseLegendText}>┆ Transição</Text>
      </View>
      <View style={styles.axisLegend}>
        {['X', 'Y', 'Z'].map((axis, index) => (
          <Text key={axis} style={[styles.axisLegendText, { color: SERIES_COLORS[index] }]}>
            ● Eixo {axis}
          </Text>
        ))}
      </View>
    </View>
  );
}

function MovementScatterChart({ readings, offsets }) {
  if (readings.length === 0) {
    return <Text style={styles.chartEmpty}>Dados insuficientes para o gráfico.</Text>;
  }

  const left = 78;
  const right = 282;
  const top = 18;
  const bottom = 222;
  const corrected = readings.map((reading) => ({
    ...reading,
    centeredX: reading.x - offsets.x,
    centeredY: reading.y - offsets.y,
  }));
  const [minimum, maximum] = getPaddedDomain(
    corrected.flatMap((reading) => [reading.centeredX, reading.centeredY])
  );
  const position = (value) =>
    left + ((value - minimum) / (maximum - minimum)) * (right - left);
  const xPosition = (value) => position(value);
  const yPosition = (value) =>
    bottom - ((value - minimum) / (maximum - minimum)) * (bottom - top);
  const staticPoints = downsample(
    corrected.filter((reading) => reading.phase === 'Estatico'),
    300
  );
  const dynamicPoints = downsample(
    corrected.filter((reading) => reading.phase === 'Dinamico'),
    300
  );

  return (
    <View accessible accessibilityLabel="Gráfico de dispersão dos eixos X e Y, separado por fase">
      <Svg width="100%" height={SCATTER_CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${SCATTER_CHART_HEIGHT}`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const coordinate = left + (index / 4) * (right - left);
          const yCoordinate = bottom - (index / 4) * (bottom - top);
          const value = minimum + (index / 4) * (maximum - minimum);
          return (
            <React.Fragment key={`scatter-grid-${index}`}>
              <Line x1={coordinate} y1={top} x2={coordinate} y2={bottom} stroke="#E0E6E2" strokeWidth={1} />
              <Line x1={left} y1={yCoordinate} x2={right} y2={yCoordinate} stroke="#E0E6E2" strokeWidth={1} />
              <SvgText x={coordinate} y={bottom + 16} textAnchor="middle" fontSize={9} fill="#52645C">
                {formatChartValue(value)}
              </SvgText>
              <SvgText x={left - 7} y={bottom - (index / 4) * (bottom - top) + 3} textAnchor="end" fontSize={9} fill="#52645C">
                {formatChartValue(value)}
              </SvgText>
            </React.Fragment>
          );
        })}
        <Line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#52645C" strokeWidth={1.5} />
        <Line x1={left} y1={top} x2={left} y2={bottom} stroke="#52645C" strokeWidth={1.5} />
        {staticPoints.map((reading, index) => (
          <Circle
            key={`static-${index}`}
            cx={xPosition(reading.centeredX)}
            cy={yPosition(reading.centeredY)}
            r={2.5}
            fill={STATIC_COLOR}
            opacity={0.55}
          />
        ))}
        {dynamicPoints.map((reading, index) => (
          <Circle
            key={`dynamic-${index}`}
            cx={xPosition(reading.centeredX)}
            cy={yPosition(reading.centeredY)}
            r={2.5}
            fill={DYNAMIC_COLOR}
            opacity={0.55}
          />
        ))}
        <SvgText x={(left + right) / 2} y={SCATTER_CHART_HEIGHT - 7} textAnchor="middle" fontSize={11} fill="#263D34">
          Giroscópio X (rad/s)
        </SvgText>
        <SvgText
          x={13}
          y={(top + bottom) / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#263D34"
          rotation="-90"
          origin={`13,${(top + bottom) / 2}`}
        >
          Giroscópio Y (rad/s)
        </SvgText>
      </Svg>
      <View style={styles.scatterLegend}>
        <Text style={[styles.phaseLegendText, { color: STATIC_COLOR }]}>● Estático</Text>
        <Text style={[styles.phaseLegendText, { color: DYNAMIC_COLOR }]}>● Dinâmico</Text>
      </View>
    </View>
  );
}

export default function App() {
  const [status, setStatus] = useState('idle');
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle');
  const beepPlayer = useAudioPlayer(null);
  const readingsRef = useRef([]);
  const startedAtRef = useRef(0);
  const subscriptionRef = useRef(null);
  const mountedRef = useRef(true);
  const runTokenRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      runTokenRef.current += 1;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  const playBeep = async (playbackRate) => {
    if (!FileSystem.cacheDirectory) {
      throw new Error('Não foi possível acessar o armazenamento temporário.');
    }

    const beepUri = `${FileSystem.cacheDirectory}avaliacao-beep.wav`;
    await FileSystem.writeAsStringAsync(beepUri, BEEP_WAV_BASE64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });

    beepPlayer.volume = 0.35;
    beepPlayer.setPlaybackRate(playbackRate);
    beepPlayer.replace({ uri: beepUri });
    beepPlayer.play();
    await wait(Math.ceil(200 / playbackRate));
  };

  const playDoubleBeep = async () => {
    await playBeep(1.5);
    await wait(100);
    await playBeep(1.5);
  };

  const startRecording = () => {
    Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);
    startedAtRef.current = Date.now();
    readingsRef.current = [];
    setAssessmentResults(null);
    setExportStatus('idle');
    subscriptionRef.current = Gyroscope.addListener(({ x, y, z }) => {
      const elapsedMs = Date.now() - startedAtRef.current;
      readingsRef.current.push({
        elapsedMs,
        x,
        y,
        z,
        phase: elapsedMs < STATIC_PHASE_DURATION_MS ? 'Estatico' : 'Dinamico',
      });
    });
    setStatus('static');
  };

  const beginAssessment = async () => {
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;
    setStatus('starting');

    try {
      if (!(await Gyroscope.isAvailableAsync())) {
        throw new Error(
          'O giroscópio não está disponível. Teste em um celular real com esse sensor.'
        );
      }

      await playBeep(0.75);
      if (!mountedRef.current || runToken !== runTokenRef.current) return;

      startRecording();
      await wait(STATIC_PHASE_DURATION_MS);
      if (!mountedRef.current || runToken !== runTokenRef.current) return;

      setStatus('dynamic');
      try {
        await playDoubleBeep();
      } catch (error) {
        if (!mountedRef.current || runToken !== runTokenRef.current) return;
        console.error('Falha ao reproduzir o sinal de início dinâmico:', error);
        Alert.alert(
          'Sinal sonoro indisponível',
          'A captura dinâmica continua. Siga a orientação exibida na tela.'
        );
      }
    } catch (error) {
      if (!mountedRef.current || runToken !== runTokenRef.current) return;
      console.error('Falha ao iniciar a avaliação:', error);
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      setStatus('idle');
      Alert.alert(
        'Não foi possível iniciar',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const exportReadings = async (readings) => {
    if (!FileSystem.cacheDirectory) {
      throw new Error('Não foi possível acessar o armazenamento temporário.');
    }

    const worksheet = XLSX.utils.aoa_to_sheet([
      [
        'Tempo (ms)',
        'Giroscópio X',
        'Giroscópio Y',
        'Giroscópio Z',
        'Fase',
      ],
      ...readings.map(({ elapsedMs, x, y, z, phase }) => [
        elapsedMs,
        x,
        y,
        z,
        phase,
      ]),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Avaliação');

    const base64 = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'base64',
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileUri = `${FileSystem.cacheDirectory}avaliacao-equilibrio-${timestamp}.xlsx`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('O compartilhamento não está disponível neste dispositivo.');
    }

    await Sharing.shareAsync(fileUri, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Compartilhar avaliação',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  };

  const shareReadings = async (readings) => {
    setExportStatus('exporting');
    try {
      await exportReadings(readings);
      if (!mountedRef.current) return;
      setExportStatus('done');
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Falha ao exportar avaliação:', error);
      setExportStatus('error');
      Alert.alert(
        'Falha ao exportar',
        `Os gráficos continuam disponíveis no app. Tente compartilhar a planilha novamente.\n\n${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const finishAssessment = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    runTokenRef.current += 1;
    const completedReadings = readingsRef.current.slice();
    readingsRef.current = [];
    setAssessmentResults(completedReadings);
    setStatus('results');
    shareReadings(completedReadings);
  };

  const handleMainAction = () => {
    if (status === 'static' || status === 'dynamic') {
      finishAssessment();
    } else if (status === 'idle') {
      beginAssessment();
    }
  };

  const buttonLabel = {
    idle: 'Iniciar Avaliação',
    starting: 'Preparando avaliação...',
    static: 'Parar Avaliação',
    dynamic: 'Parar Avaliação',
  }[status];

  const instruction = {
    idle: 'Posicione o celular com segurança e peça orientação ao profissional de saúde.',
    starting: 'Aguarde o sinal sonoro para começar.',
    static: 'Ficar Parado com o celular na cabeça',
    dynamic: 'Pode Andar',
  }[status];

  if (status === 'results' && assessmentResults) {
    const offsets = getStaticOffsets(assessmentResults);
    const staticCount = assessmentResults.filter(
      (reading) => reading.phase === 'Estatico'
    ).length;
    const dynamicCount = assessmentResults.length - staticCount;
    const durationMs = assessmentResults.reduce(
      (maximum, reading) => Math.max(maximum, reading.elapsedMs),
      0
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F4F7F5" />
        <ScrollView
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Resultado da avaliação</Text>
          <Text style={styles.subtitle}>
            Visualização do movimento registrado pelo giroscópio
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {(durationMs / 1000).toFixed(1)} s
              </Text>
              <Text style={styles.summaryLabel}>Duração</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{assessmentResults.length}</Text>
              <Text style={styles.summaryLabel}>Leituras</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {staticCount} / {dynamicCount}
              </Text>
              <Text style={styles.summaryLabel}>Estático / Dinâmico</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Movimento ao longo do tempo</Text>
            <TimeSeriesChart readings={assessmentResults} offsets={offsets} />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Movimento dos eixos X × Y</Text>
            <MovementScatterChart
              readings={assessmentResults}
              offsets={offsets}
            />
          </View>

          <Text style={styles.disclaimer}>
            Estes gráficos mostram a rotação do celular registrada pelo
            giroscópio, com o offset da fase estática removido. Eles não medem
            diretamente o equilíbrio corporal e não fornecem diagnóstico.
          </Text>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              exportStatus === 'exporting' && styles.disabledButton,
            ]}
            onPress={() => shareReadings(assessmentResults)}
            disabled={exportStatus === 'exporting'}
            accessibilityRole="button"
            accessibilityState={{ disabled: exportStatus === 'exporting' }}
          >
            <Text style={styles.secondaryButtonText}>
              {exportStatus === 'exporting'
                ? 'Preparando planilha...'
                : exportStatus === 'error'
                  ? 'Tentar compartilhar Excel'
                  : 'Compartilhar Excel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resultsNewButton]}
            onPress={() => {
              setAssessmentResults(null);
              setExportStatus('idle');
              setStatus('idle');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Nova Avaliação</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F5" />
      <View style={styles.container}>
        <Text style={styles.title}>Avaliação de equilíbrio</Text>
        <Text style={styles.subtitle}>Monitoramento de movimento da cabeça</Text>

        <View
          style={styles.center}
          accessibilityLiveRegion="polite"
          accessibilityLabel={instruction}
        >
          <Text style={styles.instruction}>{instruction}</Text>

          <TouchableOpacity
            style={[
              styles.button,
              (status === 'static' || status === 'dynamic') &&
                styles.stopButton,
              status === 'starting' && styles.disabledButton,
            ]}
            onPress={handleMainAction}
            disabled={status === 'starting'}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            accessibilityState={{
              disabled: status === 'starting',
            }}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Este aplicativo registra movimento e não substitui uma avaliação
          clínica.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
  },
  title: {
    color: '#142D25',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#40564D',
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    color: '#263D34',
    fontSize: 21,
    lineHeight: 30,
    marginBottom: 28,
    maxWidth: 460,
    textAlign: 'center',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minHeight: 82,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DFD9',
    borderRadius: 14,
    padding: 8,
  },
  summaryValue: {
    color: '#142D25',
    fontSize: 20,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#40564D',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DFD9',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  chartTitle: {
    color: '#142D25',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  chartEmpty: {
    color: '#52645C',
    fontSize: 16,
    padding: 20,
    textAlign: 'center',
  },
  phaseLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  phaseLegendText: {
    color: '#263D34',
    fontSize: 13,
  },
  axisLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 6,
  },
  axisLegendText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scatterLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  disclaimer: {
    color: '#40564D',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#075E3B',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#075E3B',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultsNewButton: {
    minHeight: 80,
    fontSize: 24,
  },
  button: {
    alignSelf: 'stretch',
    minHeight: 230,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#075E3B',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#043D27',
    padding: 24,
    elevation: 4,
  },
  stopButton: {
    backgroundColor: '#9F2D24',
    borderColor: '#6E1F19',
  },
  disabledButton: {
    backgroundColor: '#567267',
    borderColor: '#40564D',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    color: '#52645C',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
