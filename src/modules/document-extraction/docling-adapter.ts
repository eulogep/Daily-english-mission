import { resolve } from "node:path";
import { documentQuality, pageQuality } from "./core.ts";
import { pathIsWithinRoots, runBoundedLocalProcess, type LocalProcessResult } from "./local-process.ts";
import type { BlockKind, Document, DocumentBlock, DocumentExtractor, DocumentPage, ExtractionOptions, ExtractionQuality, VisualContent, VisualContentType } from "./types";

type RawDoclingItem = { self_ref?: string; label?: string; text?: string; prov?: Array<{ page_no?: number; bbox?: { l?: number; t?: number; r?: number; b?: number; coord_origin?: string } }> };
type RawDoclingPage = { size?: { width?: number; height?: number } };
type RawDoclingPayload = { sourceId: string; extractorVersion: string; document: { texts?: RawDoclingItem[]; pictures?: RawDoclingItem[]; tables?: RawDoclingItem[]; form_items?: RawDoclingItem[]; pages?: Record<string, RawDoclingPage> } };

function qualityForItem(item: RawDoclingItem): ExtractionQuality { return item.prov?.length ? "HIGH" : "MEDIUM"; }
function blockKind(label = "text"): BlockKind {
  if (["title", "section_header"].includes(label)) return "HEADING";
  if (label === "list_item") return "LIST_ITEM";
  if (label === "caption") return "CAPTION";
  if (label === "table") return "TABLE";
  if (label === "formula") return "FORMULA";
  if (label === "picture") return "IMAGE";
  return "TEXT";
}
function visualType(label: string): VisualContentType {
  if (label === "table") return "TABLE";
  if (label === "formula") return "FORMULA";
  return "IMAGE";
}

export function normalizeDoclingPayload(payload: RawDoclingPayload, options: ExtractionOptions): Document {
  const raw = payload.document;
  const itemGroups: Array<[RawDoclingItem[], string]> = [
    [raw.texts ?? [], "text"], [raw.pictures ?? [], "picture"], [raw.tables ?? [], "table"], [raw.form_items ?? [], "formula"],
  ];
  const blocks: DocumentBlock[] = [];
  const visuals: VisualContent[] = [];
  itemGroups.forEach(([items, fallbackLabel]) => items.forEach((item, index) => {
    const label = item.label ?? fallbackLabel;
    const provenance = item.prov?.[0];
    const pageNumber = provenance?.page_no ?? options.pageStart;
    const id = `block:${pageNumber}:${label}:${index}`;
    const quality = qualityForItem(item);
    const bbox = provenance?.bbox;
    blocks.push({
      id, kind: blockKind(label), label, text: item.text ?? "", pageNumber, sectionId: null, confidence: item.prov?.length ? 0.9 : 0.6,
      boundingBox: bbox ? { left: bbox.l ?? 0, top: bbox.t ?? 0, right: bbox.r ?? 0, bottom: bbox.b ?? 0, origin: bbox.coord_origin } : null,
      quality, provenance: { sourceId: options.sourceId, pageNumber, extractorId: "DOCLING", blockId: id },
    });
    if (["picture", "table", "formula"].includes(label)) {
      visuals.push({
        id: `visual:${id}`, type: visualType(label), pageNumber, status: "EXTRACTED", quality: label === "picture" ? "MEDIUM" : quality,
        semanticInterpretation: "UNVERIFIED",
        note: label === "picture" ? "Figure détectée et localisée ; ses relations sémantiques restent à vérifier." : "Structure détectée ; contenu à vérifier avant usage pédagogique.",
        provenance: { sourceId: options.sourceId, pageNumber, extractorId: "DOCLING", blockId: id },
      });
    }
  }));
  const pages: DocumentPage[] = [];
  for (let pageNumber = options.pageStart; pageNumber <= options.pageEnd; pageNumber += 1) {
    const pageBlocks = blocks.filter((block) => block.provenance.pageNumber === pageNumber);
    const pageVisuals = visuals.filter((visual) => visual.pageNumber === pageNumber);
    const dimensions = raw.pages?.[String(pageNumber)]?.size;
    const textBlocks = pageBlocks.filter((block) => !["IMAGE", "DIAGRAM"].includes(block.kind));
    const page: DocumentPage = {
      pageNumber, width: dimensions?.width ?? null, height: dimensions?.height ?? null, text: textBlocks.map((block) => block.text).filter(Boolean).join("\n"), blocks: pageBlocks,
      images: pageVisuals.filter((visual) => visual.type === "IMAGE" || visual.type === "VISUAL_DIAGRAM"),
      tables: pageVisuals.filter((visual) => visual.type === "TABLE"),
      textStatus: textBlocks.length ? "EXTRACTED" : "NOT_DETECTED",
      visualStatus: pageVisuals.length ? (pageVisuals.some((visual) => visual.semanticInterpretation === "UNVERIFIED") ? "PARTIAL" : "EXTRACTED") : "NOT_DETECTED",
      quality: "LOW", warnings: pageVisuals.some((visual) => visual.semanticInterpretation === "UNVERIFIED") ? ["Contenu visuel détecté sans interprétation sémantique garantie."] : [],
    };
    page.quality = pageQuality(page);
    pages.push(page);
  }
  const headings = blocks.filter((block) => block.kind === "HEADING");
  const sections = headings.map((heading, index) => ({
    id: `section:${options.sourceId}:${heading.provenance.pageNumber}:${index}`,
    title: heading.text || "Section sans titre",
    pageStart: heading.provenance.pageNumber,
    pageEnd: headings[index + 1] ? Math.max(heading.provenance.pageNumber, headings[index + 1].provenance.pageNumber - 1) : options.pageEnd,
    blockIds: blocks.filter((block) => block.provenance.pageNumber >= heading.provenance.pageNumber && block.provenance.pageNumber <= (headings[index + 1]?.provenance.pageNumber ?? options.pageEnd)).map((block) => block.id),
    text: blocks.filter((block) => block.provenance.pageNumber >= heading.provenance.pageNumber && block.provenance.pageNumber <= (headings[index + 1]?.provenance.pageNumber ?? options.pageEnd)).map((block) => block.text).filter(Boolean).join("\n"),
    sourceId: options.sourceId,
    confidence: heading.quality === "HIGH" ? 0.9 : 0.6,
    verificationStatus: "NEEDS_REVIEW" as const,
    quality: heading.quality,
  }));
  const document: Document = {
    schemaVersion: 1, sourceId: options.sourceId, title: headings[0]?.text || options.sourceId, format: "PDF", extractorId: "DOCLING", extractorVersion: payload.extractorVersion,
    localOnly: true, pageCount: pages.length, pages, sections, blocks,
    tables: visuals.filter((visual) => visual.type === "TABLE"), formulas: visuals.filter((visual) => visual.type === "FORMULA"), images: visuals.filter((visual) => visual.type === "IMAGE" || visual.type === "VISUAL_DIAGRAM"),
    visualContent: visuals, extractionQuality: "LOW", quality: "LOW",
    provenance: { sourceId: options.sourceId, extractorId: "DOCLING", extractorVersion: payload.extractorVersion, pageStart: options.pageStart, pageEnd: options.pageEnd },
    warnings: visuals.some((visual) => visual.semanticInterpretation === "UNVERIFIED") ? ["Une détection visuelle n’est pas une compréhension sémantique : revue humaine requise."] : [],
  };
  document.quality = documentQuality(document);
  document.extractionQuality = document.quality;
  return document;
}

export type DoclingAdapterConfig = {
  cwd: string; pythonPath: string; bridgePath: string; artifactsPath: string; allowedRoots: string[];
  runner?: (executable: string, args: string[], options: { cwd: string; timeoutMs: number; maxOutputBytes: number }) => Promise<LocalProcessResult>;
};

export class DoclingDocumentExtractor implements DocumentExtractor {
  readonly id = "DOCLING" as const;
  readonly supportedFormats = ["PDF"] as const;
  readonly capabilities = { text: true, layout: true, tables: true, formulas: true, pictures: true, ocr: false };
  readonly version = "2.121.0";
  readonly localOnly = true as const;
  private readonly config: DoclingAdapterConfig;
  constructor(config: DoclingAdapterConfig) { this.config = config; }
  async extract(documentPath: string, options: ExtractionOptions): Promise<Document> {
    if (!pathIsWithinRoots(documentPath, this.config.allowedRoots)) throw new Error("DOCUMENT_PATH_OUTSIDE_APPROVED_ROOTS");
    const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 600_000, 1_000), 900_000);
    const args = [resolve(this.config.bridgePath), "--input", resolve(documentPath), "--source-id", options.sourceId, "--page-start", String(options.pageStart), "--page-end", String(options.pageEnd), "--artifacts-path", resolve(this.config.artifactsPath), "--timeout", String(timeoutMs / 1000)];
    if (options.detectFormulas) args.push("--detect-formulas");
    for (const root of this.config.allowedRoots) args.push("--allowed-root", resolve(root));
    const runner = this.config.runner ?? runBoundedLocalProcess;
    const result = await runner(this.config.pythonPath, args, { cwd: this.config.cwd, timeoutMs, maxOutputBytes: 8 * 1024 * 1024 });
    return normalizeDoclingPayload(JSON.parse(result.stdout) as RawDoclingPayload, options);
  }
}
