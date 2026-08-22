"use client";

import { createAudioEvidenceService } from "./core";
import type { AudioBinaryStore, AudioEvidenceReference } from "./types";

const DATABASE_NAME = "engineer-learning-os-evidence";
const STORE_NAME = "files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Le stockage audio local est indisponible."));
  });
}

export const indexedDbAudioBinaryStore: AudioBinaryStore = {
  async put(id, blob, metadata) {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ blob, metadata }, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("L’audio n’a pas pu être enregistré localement."));
    });
    database.close();
  },
  async get(id) {
    const database = await openDatabase();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result?.blob instanceof Blob ? request.result.blob : null);
      request.onerror = () => reject(new Error("L’audio local n’a pas pu être relu."));
    });
    database.close();
    return blob;
  },
  async delete(id) {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("L’audio local n’a pas pu être supprimé."));
    });
    database.close();
  },
};

export const localAudioEvidenceService = createAudioEvidenceService(indexedDbAudioBinaryStore);

export async function loadAudioUrl(reference: AudioEvidenceReference) {
  const blob = await localAudioEvidenceService.load(reference);
  return blob ? URL.createObjectURL(blob) : null;
}
