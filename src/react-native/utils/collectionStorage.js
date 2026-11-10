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
