import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminPasswordModal from '../components/AdminPasswordModal';
import {
  clearCollections,
  deleteCollection,
  getCollections,
  updateCollectionParticipant,
} from '../utils/collectionStorage';

function getCollectionDate(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleString();
}

export default function AssessmentsHistoryScreen({
  exportStatus,
  onBack,
  onCollectionsChanged,
  onExport,
  onViewDetails,
}) {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminAction, setAdminAction] = useState(null);
  const [editingCollection, setEditingCollection] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedDocumentId, setEditedDocumentId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const sortCollections = (items) =>
    items
      .slice()
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() -
          new Date(left.timestamp).getTime()
      );

  useEffect(() => {
    let isMounted = true;

    getCollections()
      .then((savedCollections) => {
        if (isMounted) {
          setCollections(sortCollections(savedCollections));
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

  const confirmAdminAction = async () => {
    if (!adminAction) return false;

    try {
      if (adminAction.type === 'clear') {
        await clearCollections();
        setCollections([]);
        onCollectionsChanged(0);
      } else {
        const updatedCollections = await deleteCollection(
          adminAction.collection.id
        );
        setCollections(sortCollections(updatedCollections));
        onCollectionsChanged(updatedCollections.length);
      }
      setAdminAction(null);
      return true;
    } catch (error) {
      console.error('Falha ao excluir avaliação do histórico:', error);
      Alert.alert(
        'Falha ao excluir avaliação',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  };

  const beginEditing = (collection) => {
    setEditingCollection(collection);
    setEditedName(collection.participant?.name ?? '');
    setEditedDocumentId(collection.participant?.documentId ?? '');
  };

  const saveEditedParticipant = async () => {
    const name = editedName.trim();
    if (!name) {
      Alert.alert('Nome obrigatório', 'Informe o nome do indivíduo.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedCollection = await updateCollectionParticipant(
        editingCollection.id,
        { name, documentId: editedDocumentId.trim() }
      );
      setCollections((currentCollections) =>
        currentCollections.map((collection) =>
          collection.id === updatedCollection.id
            ? updatedCollection
            : collection
        )
      );
      setEditingCollection(null);
    } catch (error) {
      console.error('Falha ao atualizar os metadados da avaliação:', error);
      Alert.alert(
        'Falha ao salvar alterações',
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

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
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => beginEditing(collection)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar identificação de ${collection.participant?.name || 'indivíduo'}`}
                  >
                    <Text style={styles.editIcon} accessible={false}>
                      ✎
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() =>
                      setAdminAction({ type: 'delete', collection })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir avaliação de ${collection.participant?.name || 'indivíduo'}`}
                  >
                    <Text style={styles.deleteIcon} accessible={false}>
                      🗑
                    </Text>
                  </TouchableOpacity>
                </View>
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

        {!isLoading && (
          <TouchableOpacity
            style={[
              styles.clearAllButton,
              collections.length === 0 && styles.disabledButton,
            ]}
            onPress={() => setAdminAction({ type: 'clear' })}
            disabled={collections.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Limpar todo o histórico"
            accessibilityState={{ disabled: collections.length === 0 }}
          >
            <Text style={styles.clearAllButtonText}>
              Limpar todo o histórico
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <AdminPasswordModal
        visible={adminAction !== null}
        title={
          adminAction?.type === 'clear'
            ? 'Limpar todo o histórico'
            : 'Excluir avaliação'
        }
        message={
          adminAction?.type === 'clear'
            ? 'Digite a Senha do Administrador para apagar todas as coletas deste dispositivo.'
            : 'Digite a Senha do Administrador para excluir esta avaliação salva.'
        }
        confirmLabel="Excluir"
        submittingLabel="Excluindo..."
        onCancel={() => setAdminAction(null)}
        onConfirm={confirmAdminAction}
      />

      <Modal
        visible={editingCollection !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCollection(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editDialog}>
            <Text style={styles.editTitle}>Editar identificação</Text>
            <Text style={styles.editLabel}>Nome do indivíduo</Text>
            <TextInput
              style={styles.editInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Nome completo"
              placeholderTextColor="#718078"
              autoCapitalize="words"
              editable={!isSavingEdit}
              accessibilityLabel="Nome do indivíduo"
            />
            <Text style={styles.editLabel}>CPF/RG</Text>
            <TextInput
              style={styles.editInput}
              value={editedDocumentId}
              onChangeText={setEditedDocumentId}
              placeholder="CPF ou RG (opcional)"
              placeholderTextColor="#718078"
              editable={!isSavingEdit}
              accessibilityLabel="CPF ou RG"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelEditButton}
                onPress={() => setEditingCollection(null)}
                disabled={isSavingEdit}
                accessibilityRole="button"
              >
                <Text style={styles.cancelEditText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveEditButton,
                  isSavingEdit && styles.disabledButton,
                ]}
                onPress={saveEditedParticipant}
                disabled={isSavingEdit}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSavingEdit }}
              >
                <Text style={styles.saveEditText}>
                  {isSavingEdit ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  itemActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F2',
    borderRadius: 10,
  },
  editIcon: {
    color: '#075E3B',
    fontSize: 24,
    fontWeight: '700',
  },
  deleteIcon: {
    color: '#B42318',
    fontSize: 22,
    fontWeight: '700',
  },
  participantName: {
    paddingRight: 92,
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
  clearAllButton: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B42318',
    borderRadius: 14,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  clearAllButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  editDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    gap: 12,
  },
  editTitle: {
    color: '#142D25',
    fontSize: 21,
    fontWeight: '700',
  },
  editLabel: {
    color: '#263D34',
    fontSize: 14,
    fontWeight: '600',
  },
  editInput: {
    minHeight: 50,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#B9C9C0',
    borderRadius: 10,
    color: '#142D25',
    fontSize: 16,
    paddingHorizontal: 12,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelEditButton: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelEditText: {
    color: '#40564D',
    fontSize: 15,
    fontWeight: '600',
  },
  saveEditButton: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#075E3B',
    borderRadius: 10,
    paddingHorizontal: 20,
  },
  saveEditText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
