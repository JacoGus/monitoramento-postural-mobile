import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import * as XLSX from 'xlsx';

const UPDATE_INTERVAL_MS = 50;
const COUNTDOWN_SECONDS = 3;
const BEEP_WAV_BASE64 =
  'UklGRiQFAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAFAAAAAG0R3Br2FxAKjffq6ODkSe1J/hIQfBq9GKQLNPnh6bbkEuyT/KYOARpsGSwN4frv6qjk7+rh+iwNbBkBGqYOk/wS7Lbk4ek0+aQLvRh8GhIQSf5J7eDk6uiN9xAK9hfcGm0RAACT7iTlCujw9XMIFhcgG7cStwHu74TlQ+dc9MwGHxZKG+4TbQNa8f/llObU8h8FERVYGxEVHwXU8pTm/+Va8W0D7hNKGx8WzAZc9EPnhOXu77cBtxIgGxYXcwjw9QroJOWT7gAAbRHcGvYXEAqN9+ro4ORJ7Un+EhB8Gr0YpAs0+eHptuQS7JP8pg4BGmwZLA3h+u/qqOTv6uH6LA1sGQEapg6T/BLstuTh6TT5pAu9GHwaEhBJ/knt4OTq6I33EAr2F9wabREAAJPuJOUK6PD1cwgWFyAbtxK3Ae7vhOVD51z0zAYfFkob7hNtA1rx/+WU5tTyHwURFVgbERUfBdTylOb/5VrxbQPuE0obHxbMBlz0Q+eE5e7vtwG3EiAbFhdzCPD1Cugk5ZPuAABtEdwa9hcQCo336ujg5EntSf4SEHwavRikCzT54em25BLsk/ymDgEabBksDeH67+qo5O/q4fosDWwZARqmDpP8Euy25OHpNPmkC70YfBoSEEn+Se3g5OrojfcQCvYX3BptEQAAk+4k5Qro8PVzCBYXIBu3ErcB7u+E5UPnXPTMBh8WShvuE20DWvH/5ZTm1PIfBREVWBsRFR8F1PKU5v/lWvFtA+4TShsfFswGXPRD54Tl7u+3AbcSIBsWF3MI8PUK6CTlk+4AAG0R3Br2FxAKjffq6ODkSe1J/hIQfBq9GKQLNPnh6bbkEuyT/KYOARpsGSwN4frv6qjk7+rh+iwNbBkBGqYOk/wS7Lbk4ek0+aQLvRh8GhIQSf5J7eDk6uiN9xAK9hfcGm0RAACT7iTlCujw9XMIFhcgG7cStwHu74TlQ+dc9MwGHxZKG+4TbQNa8f/llObU8h8FERVYGxEVHwXU8pTm/+Va8W0D7hNKGx8WzAZc9EPnhOXu77cBtxIgGxYXcwjw9QroJOWT7gAAbRHcGvYXEAqN9+ro4ORJ7Un+EhB8Gr0YpAs0+eHptuQS7JP8pg4BGmwZLA3h+u/qqOTv6uH6LA1sGQEapg6T/BLstuTh6TT5pAu9GHwaEhBJ/knt4OTq6I33EAr2F9wabREAAJPuJOUK6PD1cwgWFyAbtxK3Ae7vhOVD51z0zAYfFkob7hNtA1rx/+WU5tTyHwURFVgbERUfBdTylOb/5VrxbQPuE0obHxbMBlz0Q+eE5e7vtwG3EiAbFhdzCPD1Cugk5ZPuAABtEdwa9hcQCo336ujg5EntSf4SEHwavRikCzT54em25BLsk/ymDgEabBksDeH67+qo5O/q4fosDWwZARqmDpP8Euy25OHpNPmkC70YfBoSEEn+Se3g5OrojfcQCvYX3BptEQAAk+4k5Qro8PVzCBYXIBu3ErcB7u+E5UPnXPTMBh8WShvuE20DWvH/5ZTm1PIfBREVWBsRFR8F1PKU5v/lWvFtA+4TShsfFswGXPRD54Tl7u+3AbcSIBsWF3MI8PUK6CTlk+4AAG0R3Br2FxAKjffq6ODkSe1J/hIQfBq9GKQLNPnh6bbkEuyT/KYOARpsGSwN4frv6qjk7+rh+iwNbBkBGqYOk/wS7Lbk4ek0+aQLvRh8Gg==';

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function App() {
  const [status, setStatus] = useState('idle');
  const [countdown, setCountdown] = useState(null);
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

  const startRecording = () => {
    Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);
    startedAtRef.current = Date.now();
    readingsRef.current = [];
    subscriptionRef.current = Gyroscope.addListener(({ x, y, z }) => {
      readingsRef.current.push({
        elapsedMs: Date.now() - startedAtRef.current,
        x,
        y,
        z,
      });
    });
    setCountdown(null);
    setStatus('recording');
  };

  const beginAssessment = async () => {
    const runToken = runTokenRef.current + 1;
    runTokenRef.current = runToken;
    setStatus('countdown');

    try {
      if (!(await Gyroscope.isAvailableAsync())) {
        throw new Error(
          'O giroscópio não está disponível. Teste em um celular real com esse sensor.'
        );
      }

      await playBeep(0.75);
      if (!mountedRef.current || runToken !== runTokenRef.current) return;

      for (let seconds = COUNTDOWN_SECONDS; seconds > 0; seconds -= 1) {
        setCountdown(seconds);
        await wait(1000);
        if (!mountedRef.current || runToken !== runTokenRef.current) return;
      }

      await playBeep(1.5);
      if (!mountedRef.current || runToken !== runTokenRef.current) return;

      startRecording();
    } catch (error) {
      if (!mountedRef.current || runToken !== runTokenRef.current) return;
      console.error('Falha ao iniciar a avaliação:', error);
      setCountdown(null);
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
      ['Tempo (≈50ms)', 'Giroscópio X           ', 'Giroscópio Y           ', 'Giroscópio Z           '],
      ...readings.map(({ elapsedMs, x, y, z }) => [elapsedMs, x, y, z]),
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

  const finishAndExport = async () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setStatus('exporting');

    try {
      await exportReadings(readingsRef.current);
      if (!mountedRef.current) return;
      readingsRef.current = [];
      setStatus('idle');
    } catch (error) {
      if (!mountedRef.current) return;
      setStatus('exportError');
      Alert.alert(
        'Falha ao exportar',
        `Os dados permanecem na memória. Toque em "Tentar exportar" para tentar novamente.\n\n${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleMainAction = () => {
    if (status === 'recording') {
      finishAndExport();
    } else if (status === 'exportError') {
      finishAndExport();
    } else if (status === 'idle') {
      beginAssessment();
    }
  };

  const buttonLabel = {
    idle: 'Iniciar Avaliação',
    countdown: 'Prepare-se',
    recording: 'Parar Avaliação',
    exporting: 'Preparando arquivo...',
    exportError: 'Tentar exportar',
  }[status];

  const instruction = {
    idle: 'Posicione o celular com segurança e peça orientação ao profissional de saúde.',
    countdown: 'Mantenha a cabeça e o celular na posição indicada.',
    recording: 'Avaliação em andamento. Toque no botão para encerrar.',
    exporting: 'Aguarde enquanto os dados são preparados.',
    exportError: 'A avaliação foi salva na memória. Tente exportar novamente.',
  }[status];

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
            countdown ? `A avaliação começa em ${countdown}` : instruction
          }
        >
          {countdown !== null ? (
            <Text
              style={styles.countdown}
              accessibilityRole="text"
              accessibilityLabel={`${countdown}`}
            >
              {countdown}
            </Text>
          ) : (
            <Text style={styles.instruction}>{instruction}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              status === 'recording' && styles.stopButton,
              (status === 'countdown' || status === 'exporting') &&
                styles.disabledButton,
            ]}
            onPress={handleMainAction}
            disabled={status === 'countdown' || status === 'exporting'}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            accessibilityState={{
              disabled: status === 'countdown' || status === 'exporting',
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
    marginBottom: 28,
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
