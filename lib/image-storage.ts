const DB_NAME = "footprint";
const DB_VERSION = 1;
const IMAGE_STORE = "images";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open image storage"));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Image storage transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Image storage transaction was aborted"));
  });
}

export async function savePhotoBlob(storageKey: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(IMAGE_STORE, "readwrite");
    transaction.objectStore(IMAGE_STORE).put(blob, storageKey);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function getPhotoBlob(storageKey: string): Promise<Blob | undefined> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(IMAGE_STORE, "readonly");
    const request = transaction.objectStore(IMAGE_STORE).get(storageKey);
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read image from storage"));
    });
    await waitForTransaction(transaction);
    return blob;
  } finally {
    database.close();
  }
}

export async function deletePhotoBlobs(storageKeys: string[]): Promise<void> {
  const uniqueKeys = Array.from(new Set(storageKeys.filter(Boolean)));
  if (uniqueKeys.length === 0) return;

  const database = await openDatabase();
  try {
    const transaction = database.transaction(IMAGE_STORE, "readwrite");
    const store = transaction.objectStore(IMAGE_STORE);
    uniqueKeys.forEach((storageKey) => store.delete(storageKey));
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
