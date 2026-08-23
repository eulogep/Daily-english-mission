import type { DocumentExtractionCache, DocumentCacheIdentity } from "./cache";
import { routeDocumentExtraction } from "./core";
import type { Document, DocumentExtractor, ExtractionOptions, ExtractionRoute, RoutingSignals } from "./types";

export type ExtractionServiceResult = { document: Document; route: ExtractionRoute; cacheHit: boolean };

export class DocumentExtractionService {
  private readonly extractors: Map<string, DocumentExtractor>;
  private readonly cache: DocumentExtractionCache;

  constructor(extractors: DocumentExtractor[], cache: DocumentExtractionCache) {
    this.extractors = new Map(extractors.map((extractor) => [extractor.id, extractor]));
    this.cache = cache;
  }

  async extract(documentPath: string, sourceChecksum: string, signals: RoutingSignals, options: ExtractionOptions): Promise<ExtractionServiceResult> {
    const route = routeDocumentExtraction(signals);
    if (!route.extractorId) throw new Error(`EXTRACTION_ROUTE_UNAVAILABLE: ${route.reasons.join(" ")}`);
    const extractor = this.extractors.get(route.extractorId);
    if (!extractor) throw new Error(`EXTRACTOR_NOT_CONFIGURED: ${route.extractorId}`);
    if (!extractor.supportedFormats.includes(signals.format)) throw new Error(`EXTRACTOR_FORMAT_UNSUPPORTED: ${signals.format}`);
    const identity: DocumentCacheIdentity = { sourceChecksum, extractorId: extractor.id, extractorVersion: extractor.version, options, schemaVersion: 1 };
    const cached = await this.cache.get(identity);
    if (cached) return { document: cached, route, cacheHit: true };
    const document = await extractor.extract(documentPath, options);
    await this.cache.set(identity, document);
    return { document, route, cacheHit: false };
  }
}
