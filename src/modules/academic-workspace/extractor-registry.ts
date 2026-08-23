import type { AcademicExtractorDescriptor, CourseFormat, DuplicateClassification, PotentialAcademicSource } from "./types";

export const academicExtractorRegistry: Record<CourseFormat, AcademicExtractorDescriptor> = {
  PDF: {
    format: "PDF", supported: true, localOnly: true, version: "pdfjs-dist@6.2.108",
    capabilities: { text: true, pageProvenance: true, sectionDetection: true, tables: "LIMITED", scannedPdf: "OCR_REQUIRED" },
    limitations: ["Pas d’OCR automatique.", "Ordre de lecture complexe et tableaux à vérifier.", "Les sections à faible confiance nécessitent une revue."],
  },
  DOCX: {
    format: "DOCX", supported: true, localOnly: true, version: "DOCX_XML_LOCAL@1",
    capabilities: { text: true, pageProvenance: false, sectionDetection: true, tables: "LIMITED", scannedPdf: "NOT_APPLICABLE" },
    limitations: ["La pagination Word n’est pas stable sans moteur de rendu."],
  },
  MARKDOWN: {
    format: "MARKDOWN", supported: true, localOnly: true, version: "PLAIN_TEXT_LOCAL@1",
    capabilities: { text: true, pageProvenance: false, sectionDetection: true, tables: "LIMITED", scannedPdf: "NOT_APPLICABLE" },
    limitations: ["Pas de notion de page."],
  },
  TEXT: {
    format: "TEXT", supported: true, localOnly: true, version: "PLAIN_TEXT_LOCAL@1",
    capabilities: { text: true, pageProvenance: false, sectionDetection: false, tables: "NONE", scannedPdf: "NOT_APPLICABLE" },
    limitations: ["Structure sémantique non garantie."],
  },
  CSV: {
    format: "CSV", supported: true, localOnly: true, version: "CSV_LOCAL@1",
    capabilities: { text: true, pageProvenance: false, sectionDetection: false, tables: "SUPPORTED", scannedPdf: "NOT_APPLICABLE" },
    limitations: ["Le délimiteur et l’encodage doivent être validés."],
  },
};

export function extractorFor(format: CourseFormat) {
  return academicExtractorRegistry[format];
}

export function classifyInventoryDuplicate(checksum: string, exactChecksums: string[], possibleDuplicateChecksums: string[]): DuplicateClassification {
  if (exactChecksums.includes(checksum)) return "EXACT_DUPLICATE";
  if (possibleDuplicateChecksums.includes(checksum)) return "POSSIBLE_DUPLICATE";
  return "NEW_SOURCE";
}

export const potentialAcademicSources: PotentialAcademicSource[] = [
  { fileName: "CH01_Introduction_INF3050.pdf", format: "PDF", possibleSubject: "Réseaux", extractionSupport: "SUPPORTED", status: "INGESTED" },
  { fileName: "CH02_Couche_Physique_INF3050.pdf", format: "PDF", possibleSubject: "Réseaux", extractionSupport: "SUPPORTED", status: "POTENTIAL" },
  { fileName: "Réseau informatique.docx", format: "DOCX", possibleSubject: "Réseaux", extractionSupport: "SUPPORTED", status: "INGESTED" },
  { fileName: "Cours administration système.pdf", format: "PDF", possibleSubject: "Administration système", extractionSupport: "SUPPORTED", status: "POTENTIAL" },
];

