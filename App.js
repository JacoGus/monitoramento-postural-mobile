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
const PREPARATION_COUNTDOWN_SECONDS = 3;
const STATIC_PHASE_DURATION_MS = 5000;
const EMA_CUTOFF_HZ = 3;
const EIXO_LATERAL = 'x';
const EIXO_ANTERO_POSTERIOR = 'y';
const CONFIDENCE_95_CHI_SQUARE = 5.991;
const AXIS_LABELS = {
  x: 'X',
  y: 'Y',
  z: 'Z',
};
const CHART_WIDTH = 360;
const SERIES_CHART_HEIGHT = 250;
const SCATTER_CHART_HEIGHT = 280;
const SERIES_COLORS = ['#1565C0', '#00897B', '#EF6C00'];
const STATIC_COLOR = '#1565C0';
const DYNAMIC_COLOR = '#D32F2F';
const PREPARATION_BEEP_WAV_BASE64 =
  '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';
const STATIC_START_BEEP_WAV_BASE64 =
  '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';
const DYNAMIC_START_BEEP_WAV_BASE64 =
  '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';

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
const formatMetric = (value) =>
  Number.isFinite(value) ? value.toFixed(3) : '—';

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

const filterReadingsEma = (readings, offsets) => {
  const previousValues = { x: null, y: null, z: null };
  let previousElapsedMs = null;

  return readings.map((reading) => {
    const elapsedSeconds =
      previousElapsedMs === null
        ? UPDATE_INTERVAL_MS / 1000
        : Math.max(0, reading.elapsedMs - previousElapsedMs) / 1000;
    // Derive alpha from each sensor timestamp so jitter in the sample interval is accounted for.
    const alpha = 1 - Math.exp(-2 * Math.PI * EMA_CUTOFF_HZ * elapsedSeconds);
    const filteredReading = { ...reading };

    ['x', 'y', 'z'].forEach((axis) => {
      const calibratedValue = reading[axis] - offsets[axis];
      previousValues[axis] =
        previousValues[axis] === null
          ? calibratedValue
          : previousValues[axis] +
            alpha * (calibratedValue - previousValues[axis]);
      filteredReading[axis] = previousValues[axis];
    });

    previousElapsedMs = reading.elapsedMs;
    return filteredReading;
  });
};

const calculateRms = (readings, axis) => {
  const dynamicValues = readings
    .filter((reading) => reading.phase === 'Dinamico')
    .map((reading) => reading[axis]);

  if (dynamicValues.length === 0) return null;

  const meanSquare =
    dynamicValues.reduce((sum, value) => sum + value * value, 0) /
    dynamicValues.length;
  return Math.sqrt(meanSquare);
};

const getDynamicReadings = (readings) =>
  readings.filter((reading) => reading.phase === 'Dinamico');

const calculateConfidenceEllipseArea95 = (readings) => {
  const dynamicReadings = getDynamicReadings(readings);
  if (dynamicReadings.length < 2) return null;

  const meanX =
    dynamicReadings.reduce((sum, reading) => sum + reading.x, 0) /
    dynamicReadings.length;
  const meanY =
    dynamicReadings.reduce((sum, reading) => sum + reading.y, 0) /
    dynamicReadings.length;
  const denominator = dynamicReadings.length - 1;
  let varianceX = 0;
  let varianceY = 0;
  let covarianceXY = 0;

  dynamicReadings.forEach((reading) => {
    const centeredX = reading.x - meanX;
    const centeredY = reading.y - meanY;
    varianceX += centeredX * centeredX;
    varianceY += centeredY * centeredY;
    covarianceXY += centeredX * centeredY;
  });

  varianceX /= denominator;
  varianceY /= denominator;
  covarianceXY /= denominator;

  const trace = varianceX + varianceY;
  const discriminant = Math.sqrt(
    Math.max(
      0,
      (varianceX - varianceY) ** 2 + 4 * covarianceXY ** 2
    )
  );
  // The bivariate-normal 95% ellipse area is pi * chi-square(2) * sqrt(det(covariance)).
  const largestEigenvalue = Math.max(0, (trace + discriminant) / 2);
  const smallestEigenvalue = Math.max(0, (trace - discriminant) / 2);

  return (
    Math.PI *
    CONFIDENCE_95_CHI_SQUARE *
    Math.sqrt(largestEigenvalue * smallestEigenvalue)
  );
};

const calculateMeanAbsoluteJerk = (readings) => {
  const dynamicReadings = getDynamicReadings(readings);
  if (dynamicReadings.length < 3) return null;

  // Differentiate angular velocity into acceleration, then acceleration into jerk.
  const angularAccelerations = [];
  for (let index = 0; index < dynamicReadings.length - 1; index += 1) {
    const current = dynamicReadings[index];
    const next = dynamicReadings[index + 1];
    const intervalSeconds = (next.elapsedMs - current.elapsedMs) / 1000;
    if (intervalSeconds <= 0) continue;

    angularAccelerations.push({
      elapsedMs: (current.elapsedMs + next.elapsedMs) / 2,
      x: (next.x - current.x) / intervalSeconds,
      y: (next.y - current.y) / intervalSeconds,
      z: (next.z - current.z) / intervalSeconds,
    });
  }

  if (angularAccelerations.length < 2) return null;

  let totalJerkMagnitude = 0;
  let jerkCount = 0;
  for (let index = 0; index < angularAccelerations.length - 1; index += 1) {
    const current = angularAccelerations[index];
    const next = angularAccelerations[index + 1];
    const intervalSeconds = (next.elapsedMs - current.elapsedMs) / 1000;
    if (intervalSeconds <= 0) continue;

    const jerkX = (next.x - current.x) / intervalSeconds;
    const jerkY = (next.y - current.y) / intervalSeconds;
    const jerkZ = (next.z - current.z) / intervalSeconds;
    totalJerkMagnitude += Math.sqrt(jerkX ** 2 + jerkY ** 2 + jerkZ ** 2);
    jerkCount += 1;
  }

  return jerkCount === 0 ? null : totalJerkMagnitude / jerkCount;
};

const calculateMeanSwayVelocity = (readings) => {
  const dynamicReadings = getDynamicReadings(readings);
  if (dynamicReadings.length < 2) return null;

  const durationSeconds =
    (dynamicReadings[dynamicReadings.length - 1].elapsedMs -
      dynamicReadings[0].elapsedMs) /
    1000;
  if (durationSeconds <= 0) return null;

  // This is the X/Y angular-velocity path length, not a direct body-sway measurement.
  let pathLength = 0;
  for (let index = 1; index < dynamicReadings.length; index += 1) {
    const previous = dynamicReadings[index - 1];
    const current = dynamicReadings[index];
    pathLength += Math.sqrt(
      (current.x - previous.x) ** 2 + (current.y - previous.y) ** 2
    );
  }

  return pathLength / durationSeconds;
};

const calculateAssessmentMetrics = (readings, filteredReadings) => ({
  durationSeconds:
    readings.length > 0
      ? readings[readings.length - 1].elapsedMs / 1000
      : 0,
  readingCount: readings.length,
  rmsX: calculateRms(filteredReadings, 'x'),
  rmsY: calculateRms(filteredReadings, 'y'),
  confidenceEllipseArea95: calculateConfidenceEllipseArea95(filteredReadings),
  meanAbsoluteJerk: calculateMeanAbsoluteJerk(filteredReadings),
  meanSwayVelocity: calculateMeanSwayVelocity(filteredReadings),
});

function TimeSeriesChart({ readings }) {
  const points = downsample(readings);
  if (points.length < 2) {
    return <Text style={styles.chartEmpty}>Dados insuficientes para o gráfico.</Text>;
  }

  const left = 58;
  const right = 348;
  const top = 20;
  const bottom = 198;
  const duration = Math.max(points[points.length - 1].elapsedMs, 1);
  const allValues = points.flatMap((reading) => [reading.x, reading.y, reading.z]);
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
        const y = yPosition(reading[axis]);
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
          rad/s (filtrado e calibrado)
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

function MovementScatterChart({ readings }) {
  if (readings.length === 0) {
    return <Text style={styles.chartEmpty}>Dados insuficientes para o gráfico.</Text>;
  }

  const left = 78;
  const right = 282;
  const top = 18;
  const bottom = 222;
  const xAxis = EIXO_LATERAL;
  const yAxis = EIXO_ANTERO_POSTERIOR;
  const [minimum, maximum] = getPaddedDomain(
    readings.flatMap((reading) => [reading[xAxis], reading[yAxis]])
  );
  const position = (value) =>
    left + ((value - minimum) / (maximum - minimum)) * (right - left);
  const xPosition = (value) => position(value);
  const yPosition = (value) =>
    bottom - ((value - minimum) / (maximum - minimum)) * (bottom - top);
  const staticPoints = downsample(
    readings.filter((reading) => reading.phase === 'Estatico'),
    300
  );
  const dynamicPoints = downsample(
    readings.filter((reading) => reading.phase === 'Dinamico'),
    300
  );

  return (
    <View
      accessible
      accessibilityLabel={`Gráfico de dispersão dos eixos ${AXIS_LABELS[xAxis]} e ${AXIS_LABELS[yAxis]}, separado por fase`}
    >
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
        {dynamicPoints.map((reading, index) => (
          <Circle
            key={`dynamic-${index}`}
            cx={xPosition(reading[xAxis])}
            cy={yPosition(reading[yAxis])}
            r={2}
            fill={DYNAMIC_COLOR}
            opacity={0.4}
          />
        ))}
        {staticPoints.map((reading, index) => (
          <Circle
            key={`static-${index}`}
            cx={xPosition(reading[xAxis])}
            cy={yPosition(reading[yAxis])}
            r={3.2}
            fill={STATIC_COLOR}
            opacity={0.85}
          />
        ))}
        <SvgText x={(left + right) / 2} y={SCATTER_CHART_HEIGHT - 7} textAnchor="middle" fontSize={11} fill="#263D34">
          Giroscópio {AXIS_LABELS[xAxis]} (rad/s)
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
          Giroscópio {AXIS_LABELS[yAxis]} (rad/s)
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
  const [countdown, setCountdown] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle');
  const beepPlayer = useAudioPlayer(null);
  const beepFilesRef = useRef({});
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

  const playBeep = async (name, audioBase64) => {
    if (!FileSystem.cacheDirectory) {
      throw new Error('Não foi possível acessar o armazenamento temporário.');
    }

    let beepUri = beepFilesRef.current[name];
    if (!beepUri) {
      beepUri = `${FileSystem.cacheDirectory}avaliacao-${name}.wav`;
      await FileSystem.writeAsStringAsync(beepUri, audioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      beepFilesRef.current[name] = beepUri;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    });

    beepPlayer.volume = 0.35;
    beepPlayer.replace({ uri: beepUri });
    beepPlayer.play();
    await wait(140);
  };

  const playDoubleBeep = async () => {
    await playBeep('dinamico', DYNAMIC_START_BEEP_WAV_BASE64);
    await wait(100);
    await playBeep('dinamico', DYNAMIC_START_BEEP_WAV_BASE64);
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
    setStatus('preparing');
    setCountdown(null);

    try {
      if (!(await Gyroscope.isAvailableAsync())) {
        throw new Error(
          'O giroscópio não está disponível. Teste em um celular real com esse sensor.'
        );
      }

      setStatus('countdown');
      for (
        let seconds = PREPARATION_COUNTDOWN_SECONDS;
        seconds > 0;
        seconds -= 1
      ) {
        setCountdown(seconds);
        await playBeep('preparo', PREPARATION_BEEP_WAV_BASE64);
        if (!mountedRef.current || runToken !== runTokenRef.current) return;

        if (seconds > 1) {
          await wait(1000 - Math.ceil(200 / 0.75));
          if (!mountedRef.current || runToken !== runTokenRef.current) return;
        }
      }

      setCountdown(null);
      setStatus('startingStatic');
      await playBeep('estatico', STATIC_START_BEEP_WAV_BASE64);
      if (!mountedRef.current || runToken !== runTokenRef.current) return;

      startRecording();
      let staticTickSoundFailed = false;
      for (
        let seconds = STATIC_PHASE_DURATION_MS / 1000;
        seconds > 0;
        seconds -= 1
      ) {
        setCountdown(seconds);
        try {
          await playBeep('preparo', PREPARATION_BEEP_WAV_BASE64);
        } catch (error) {
          if (!staticTickSoundFailed) {
            staticTickSoundFailed = true;
            console.error('Falha ao reproduzir o beep da fase estática:', error);
            Alert.alert(
              'Sinal sonoro indisponível',
              'A captura estática continua. Mantenha-se parado até o aviso para andar.'
            );
          }
        }
        if (!mountedRef.current || runToken !== runTokenRef.current) return;

        const elapsedMs = Date.now() - startedAtRef.current;
        const nextTickAtMs =
          (STATIC_PHASE_DURATION_MS / 1000 - seconds + 1) * 1000;
        await wait(Math.max(0, nextTickAtMs - elapsedMs));
        if (!mountedRef.current || runToken !== runTokenRef.current) return;
      }

      setCountdown(null);
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
      setCountdown(null);
      setStatus('idle');
      Alert.alert(
        'Não foi possível iniciar',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const exportReadings = async (readings, metrics) => {
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
    const summaryWorksheet = XLSX.utils.aoa_to_sheet([
      [
        'Duração total (s)',
        'Leituras',
        'RMS X dinâmico (rad/s)',
        'RMS Y dinâmico (rad/s)',
        'Área elipse 95% X/Y ((rad/s)^2)',
        'Jerk médio absoluto (rad/s^3)',
        'Velocidade média X/Y (rad/s^2)',
      ],
      [
        metrics.durationSeconds,
        metrics.readingCount,
        metrics.rmsX,
        metrics.rmsY,
        metrics.confidenceEllipseArea95,
        metrics.meanAbsoluteJerk,
        metrics.meanSwayVelocity,
      ],
    ]);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumo');

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

  const shareReadings = async (readings, metrics) => {
    setExportStatus('exporting');
    try {
      await exportReadings(readings, metrics);
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
    const offsets = getStaticOffsets(completedReadings);
    const filteredReadings = filterReadingsEma(completedReadings, offsets);
    const metrics = calculateAssessmentMetrics(
      completedReadings,
      filteredReadings
    );
    setAssessmentResults({
      readings: completedReadings,
      filteredReadings,
      metrics,
    });
    setStatus('results');
    shareReadings(completedReadings, metrics);
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
    preparing: 'Preparando avaliação...',
    countdown: 'Prepare-se',
    startingStatic: 'Iniciando fase parada...',
    static: 'Parar Avaliação',
    dynamic: 'Parar Avaliação',
  }[status];

  const instruction = {
    idle: 'Posicione o celular com segurança e peça orientação ao profissional de saúde.',
    preparing: 'Aguarde o beep para iniciar o preparo.',
    countdown: 'Fique parado e mantenha o celular na cabeça.',
    startingStatic: 'Fique parado com o celular na cabeça.',
    static: 'Ficar Parado com o celular na cabeça',
    dynamic: 'Pode Andar',
  }[status];

  if (status === 'results' && assessmentResults) {
    const { readings, filteredReadings, metrics } = assessmentResults;
    const staticCount = readings.filter(
      (reading) => reading.phase === 'Estatico'
    ).length;
    const dynamicCount = readings.length - staticCount;
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
                {metrics.durationSeconds.toFixed(1)} s
              </Text>
              <Text style={styles.summaryLabel}>Duração</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{readings.length}</Text>
              <Text style={styles.summaryLabel}>Leituras</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {staticCount} / {dynamicCount}
              </Text>
              <Text style={styles.summaryLabel}>Estático / Dinâmico</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatMetric(metrics.rmsX)}</Text>
              <Text style={styles.summaryLabel}>RMS X dinâmico (rad/s)</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatMetric(metrics.rmsY)}</Text>
              <Text style={styles.summaryLabel}>RMS Y dinâmico (rad/s)</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.metricSummaryCard]}>
              <Text style={[styles.summaryValue, styles.metricSummaryValue]}>
                {formatMetric(metrics.confidenceEllipseArea95)}
              </Text>
              <Text style={styles.summaryLabel}>
                Área da elipse 95% X/Y ((rad/s)²)
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.metricSummaryCard]}>
              <Text style={[styles.summaryValue, styles.metricSummaryValue]}>
                {formatMetric(metrics.meanAbsoluteJerk)}
              </Text>
              <Text style={styles.summaryLabel}>
                Jerk médio absoluto (rad/s³)
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.metricSummaryCard]}>
              <Text style={[styles.summaryValue, styles.metricSummaryValue]}>
                {formatMetric(metrics.meanSwayVelocity)}
              </Text>
              <Text style={styles.summaryLabel}>
                Velocidade média X/Y (rad/s²)
              </Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Movimento ao longo do tempo</Text>
            <TimeSeriesChart readings={filteredReadings} />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              Movimento dos eixos {AXIS_LABELS[EIXO_LATERAL]} ×{' '}
              {AXIS_LABELS[EIXO_ANTERO_POSTERIOR]}
            </Text>
            <MovementScatterChart readings={filteredReadings} />
          </View>

          <Text style={styles.disclaimer}>
            Estes gráficos mostram a rotação do celular registrada pelo
            giroscópio, com o offset da fase estática removido. A elipse de 95%
            pressupõe uma distribuição aproximadamente normal dos dados. As
            métricas angulares são indicadores descritivos do movimento
            registrado, não medem diretamente o equilíbrio corporal e não
            fornecem diagnóstico.
          </Text>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              exportStatus === 'exporting' && styles.disabledButton,
            ]}
            onPress={() => shareReadings(readings, metrics)}
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
          accessibilityLabel={
            countdown === null
              ? instruction
              : `${instruction} ${countdown}`
          }
        >
          {countdown !== null && (
            <Text
              style={styles.countdown}
              accessibilityRole="text"
              accessibilityLabel={`${countdown}`}
            >
              {countdown}
            </Text>
          )}
          <Text style={styles.instruction}>{instruction}</Text>

          <TouchableOpacity
            style={[
              styles.button,
              (status === 'static' || status === 'dynamic') &&
                styles.stopButton,
              (status === 'preparing' ||
                status === 'countdown' ||
                status === 'startingStatic') &&
                styles.disabledButton,
            ]}
            onPress={handleMainAction}
            disabled={
              status === 'preparing' ||
              status === 'countdown' ||
              status === 'startingStatic'
            }
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            accessibilityState={{
              disabled:
                status === 'preparing' ||
                status === 'countdown' ||
                status === 'startingStatic',
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
  countdown: {
    color: '#142D25',
    fontSize: 112,
    fontWeight: '800',
    marginBottom: 18,
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
  metricSummaryCard: {
    paddingHorizontal: 4,
  },
  summaryValue: {
    color: '#142D25',
    fontSize: 20,
    fontWeight: '800',
  },
  metricSummaryValue: {
    fontSize: 16,
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
