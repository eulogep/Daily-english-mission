import type { Document, DocumentPage, ExtractionQuality, ExtractionRoute, RoutingSignals } from "./types";

const QUALITY_WEIGHT: Record<ExtractionQuality, number> = { FAILED: 0, LOW: 1, MEDIUM: 2, HIGH: 3 };

export function weakestQuality(values: ExtractionQuality[]): ExtractionQuality {
  return values.length ? values.reduce((lowest, value) => QUALITY_WEIGHT[value] < QUALITY_WEIGHT[lowest] ? value : lowest) : "FAILED";
}

export function pageQuality(page: Pick<DocumentPage, "blocks" | "textStatus" | "visualStatus">): ExtractionQuality {
  if (page.textStatus === "FAILED" || page.visualStatus === "FAILED") return "FAILED";
  if (page.blocks.length === 0) return "LOW";
  if (page.textStatus === "PARTIAL" || page.visualStatus === "PARTIAL") return "MEDIUM";
  if (page.textStatus === "NOT_DETECTED" && page.visualStatus === "NOT_DETECTED") return "LOW";
  return "HIGH";
}

export function documentQuality(document: Pick<Document, "pages">): ExtractionQuality {
  return weakestQuality(document.pages.map((page) => page.quality));
}

export function routeDocumentExtraction(signals: RoutingSignals): ExtractionRoute {
  const complex = Boolean(signals.complexLayout || signals.needsTables || signals.needsFormulas || signals.needsPictures);
  if (signals.format === "PDF") {
    if (signals.pdfType === "SCANNED_PDF") return { extractorId: null, qualityCeiling: "FAILED", degraded: true, reasons: ["OCR_REQUIRED : aucune couche texte fiable ; utiliser un adaptateur OCR local explicite."] };
    if (signals.pdfType === "MIXED_PDF" || complex || signals.textLayerReliable === false) {
      if (signals.doclingAvailable) return { extractorId: "DOCLING", qualityCeiling: "HIGH", degraded: false, reasons: ["Structure visuelle ou couche texte insuffisante : moteur complexe requis."] };
      return { extractorId: "PDFJS", qualityCeiling: "LOW", degraded: true, reasons: ["Docling indisponible : repli texte PDF.js sans compréhension visuelle."] };
    }
    return { extractorId: "PDFJS", qualityCeiling: "HIGH", degraded: false, reasons: ["PDF texte simple : extraction légère suffisante."] };
  }
  if (["DOCX", "PPTX", "XLSX"].includes(signals.format)) {
    return signals.doclingAvailable
      ? { extractorId: "DOCLING", qualityCeiling: "HIGH", degraded: false, reasons: ["Format bureautique structuré pris en charge par Docling."] }
      : { extractorId: null, qualityCeiling: "FAILED", degraded: true, reasons: ["Aucun extracteur local compatible n’est disponible."] };
  }
  return { extractorId: null, qualityCeiling: "FAILED", degraded: true, reasons: ["Le routeur complexe ne prend pas en charge ce format."] };
}
