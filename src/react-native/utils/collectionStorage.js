import AsyncStorage from '@react-native-async-storage/async-storage';

export const COLLECTIONS_STORAGE_KEY = '@monitoramento-postural/coletas';

export async function getCollections() {
  const storedCollections = await AsyncStorage.getItem(COLLECTIONS_STORAGE_KEY);
  if (storedCollections === null) {
    return [];
  }

  const collections = JSON.parse(storedCollections);
  if (!Array.isArray(collections)) {
    throw new Error('O histórico armazenado não está em um formato válido.');
  }

  return collections;
}

export async function saveCollection(collection) {
  const collections = await getCollections();
  const updatedCollections = [...collections, collection];
  await AsyncStorage.setItem(
    COLLECTIONS_STORAGE_KEY,
    JSON.stringify(updatedCollections)
  );
  return updatedCollections;
}

export async function getCollectionsCount() {
  const collections = await getCollections();
  return collections.length;
}

export async function clearCollections() {
  await AsyncStorage.removeItem(COLLECTIONS_STORAGE_KEY);
}

export async function deleteCollection(collectionId) {
  if (typeof collectionId !== 'string' || collectionId.length === 0) {
    throw new Error('A avaliação selecionada não possui um identificador válido.');
  }

  const collections = await getCollections();
  if (!collections.some((collection) => collection.id === collectionId)) {
    throw new Error('A avaliação selecionada não foi encontrada no histórico.');
  }

  const updatedCollections = collections.filter(
    (collection) => collection.id !== collectionId
  );
  await AsyncStorage.setItem(
    COLLECTIONS_STORAGE_KEY,
    JSON.stringify(updatedCollections)
  );
  return updatedCollections;
}

export async function updateCollectionParticipant(collectionId, participant) {
  if (typeof collectionId !== 'string' || collectionId.length === 0) {
    throw new Error('A avaliação selecionada não possui um identificador válido.');
  }

  const collections = await getCollections();
  const collectionIndex = collections.findIndex(
    (collection) => collection.id === collectionId
  );
  if (collectionIndex === -1) {
    throw new Error('A avaliação selecionada não foi encontrada no histórico.');
  }

  const updatedCollection = {
    ...collections[collectionIndex],
    participant: {
      ...collections[collectionIndex].participant,
      name: participant.name,
      documentId: participant.documentId,
    },
  };
  const updatedCollections = [...collections];
  updatedCollections[collectionIndex] = updatedCollection;
  await AsyncStorage.setItem(
    COLLECTIONS_STORAGE_KEY,
    JSON.stringify(updatedCollections)
  );
  return updatedCollection;
}
