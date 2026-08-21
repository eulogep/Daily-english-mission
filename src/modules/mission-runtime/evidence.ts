import type { EvidenceMetadata } from "./types";

const DATABASE_NAME = "engineer-learning-os-evidence";
const STORE_NAME = "files";
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_EVIDENCE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export function validateEvidenceFile(file: Pick<File, "size" | "type">): string | null {
  if (!ALLOWED_EVIDENCE_TYPES.includes(file.type as (typeof ALLOWED_EVIDENCE_TYPES)[number])) {
    return "Choisis une image PNG, JPEG ou WebP, ou un fichier XLSX.";
  }
  if (file.size <= 0) return "Le fichier est vide.";
  if (file.size > MAX_EVIDENCE_BYTES) return "Le fichier dépasse la limite locale de 5 Mo.";
  return null;
}

function openEvidenceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Le stockage local de preuve est indisponible."));
  });
}

export async function saveEvidenceFile(file: File): Promise<EvidenceMetadata> {
  const error = validateEvidenceFile(file);
  if (error) throw new Error(error);

  const id = crypto.randomUUID();
  const extension = file.type.includes("spreadsheet") ? "xlsx" : file.type.split("/")[1].replace("jpeg", "jpg");
  const metadata: EvidenceMetadata = {
    id,
    displayName: `preuve-excel-${id.slice(0, 8)}.${extension}`,
    mimeType: file.type,
    size: file.size,
    storedAt: Date.now(),
  };
  const database = await openEvidenceDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ blob: file, metadata }, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("La preuve n’a pas pu être enregistrée localement."));
  });
  database.close();
  return metadata;
}
