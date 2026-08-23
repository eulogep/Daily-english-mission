import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Document, DocumentExtractorId, ExtractionOptions } from "./types";

export type DocumentCacheIdentity = {
  sourceChecksum: string;
  extractorId: DocumentExtractorId;
  extractorVersion: string;
  options: ExtractionOptions;
  schemaVersion: 1;
};
export interface DocumentExtractionCache {
  get(identity: DocumentCacheIdentity): Promise<Document | null>;
  set(identity: DocumentCacheIdentity, document: Document): Promise<void>;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function documentCacheKey(identity: DocumentCacheIdentity) {
  return createHash("sha256").update(stable(identity)).digest("hex");
}

export class FileDocumentExtractionCache implements DocumentExtractionCache {
  private readonly directory: string;
  constructor(directory: string) { this.directory = directory; }
  async get(identity: DocumentCacheIdentity): Promise<Document | null> {
    try {
      return JSON.parse(await readFile(join(this.directory, `${documentCacheKey(identity)}.json`), "utf8")) as Document;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  async set(identity: DocumentCacheIdentity, document: Document) {
    await mkdir(this.directory, { recursive: true });
    const destination = join(this.directory, `${documentCacheKey(identity)}.json`);
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(document), "utf8");
    await rename(temporary, destination);
  }
}
