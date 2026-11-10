import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCollections } from '../utils/collectionStorage';

function getCollectionDate(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleString();
}

export default function AssessmentsHistoryScreen({
  exportStatus,
  onBack,
  onExport,
  onViewDetails,
}) {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getCollections()
      .then((savedCollections) => {
        if (isMounted) {
          setCollections(
            savedCollections
              .slice()
              .sort(
                (left, right) =>
                  new Date(right.timestamp).getTime() -
                  new Date(left.timestamp).getTime()
              )
          );
        }
      })
      .catch((error) => {
        console.error('Falha ao carregar o histórico de avaliações:', error);
        if (isMounted) {
          Alert.alert(
            'Falha ao carregar histórico',
            error instanceof Error ? error.message : String(error)
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isExporting = exportStatus.startsWith('exporting-');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7F5" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela inicial"
        >
          <Text style={styles.backButtonText}>‹  Início</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Avaliações Salvas</Text>
        <Text style={styles.subtitle}>
          {collections.length} {collections.length === 1 ? 'avaliação' : 'avaliações'} armazenadas neste dispositivo
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#075E3B"
            accessibilityLabel="Carregando avaliações"
          />
        ) : collections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhuma avaliação salva. As coletas concluídas aparecerão aqui.
            </Text>
          </View>
        ) : (
          collections.map((collection, index) => {
            const readings = Array.isArray(collection.readings)
              ? collection.readings
              : [];
            const staticCount = readings.filter(
              (reading) =>
                reading.phase === 'Estatico' || reading.phase === 'Estático'
            ).length;
            const dynamicCount = readings.length - staticCount;
            const itemIsExporting = isExporting;

            return (
              <View
                key={collection.id ?? `${collection.timestamp}-${index}`}
                style={styles.collectionCard}
              >
                <Text style={styles.participantName}>
                  {collection.participant?.name || 'Indivíduo sem nome'}
                </Text>
                <Text style={styles.collectionDetail}>
                  {getCollectionDate(collection.timestamp)}
                </Text>
                <Text style={styles.collectionDetail}>
                  Teste: {collection.testType || 'Não informado'}
                </Text>
                <Text style={styles.collectionDetail}>
                  Duração: {Number(collection.metrics?.durationSeconds ?? 0).toFixed(1)} s
                  {' · '}
                  {collection.metrics?.readingCount ?? readings.length} leituras
                </Text>
                <Text style={styles.collectionDetail}>
                  Estático / Dinâmico: {staticCount} / {dynamicCount}
                </Text>
                <Text style={styles.collectionType}>
                  {collection.collectionType === 'padrao' ? 'Padrão' : 'Avaliação'}
                </Text>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => onViewDetails(collection)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalhes da avaliação de ${collection.participant?.name || 'indivíduo'}`}
                >
                  <Text style={styles.detailsButtonText}>Visualizar Detalhes</Text>
                </TouchableOpacity>

                <View style={styles.exportRow}>
                  <TouchableOpacity
                    style={[
                      styles.exportButton,
                      itemIsExporting && styles.disabledButton,
                    ]}
                    onPress={() => onExport('xlsx', collection)}
                    disabled={itemIsExporting}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: itemIsExporting }}
                  >
                    <Text style={styles.exportButtonText}>Exportar XLSX</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.exportButton,
                      itemIsExporting && styles.disabledButton,
                    ]}
                    onPress={() => onExport('csv', collection)}
                    disabled={itemIsExporting}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: itemIsExporting }}
                  >
                    <Text style={styles.exportButtonText}>Exportar CSV</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: '#075E3B',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: '#142D25',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#40564D',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DFD9',
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    color: '#40564D',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
  collectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4DFD9',
    borderRadius: 16,
    padding: 16,
    gap: 7,
  },
  participantName: {
    color: '#142D25',
    fontSize: 19,
    fontWeight: '700',
  },
  collectionDetail: {
    color: '#40564D',
    fontSize: 14,
  },
  collectionType: {
    color: '#075E3B',
    fontSize: 14,
    fontWeight: '700',
  },
  detailsButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#142D25',
    borderRadius: 10,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E4EFE9',
    borderWidth: 1,
    borderColor: '#C4D8CC',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  exportButtonText: {
    color: '#075E3B',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
});
