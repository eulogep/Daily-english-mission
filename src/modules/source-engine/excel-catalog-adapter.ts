import type { CompetencyId } from "../learning-records/types";
import type { ExcelCatalog, ExcelCatalogResource, SourceRecord, SourceType } from "./types";

const competencyIds = new Set<CompetencyId>([
  "EXCEL_CSV_IMPORT",
  "TECHNICAL_ENGLISH_EXPLANATION",
  "DATA_ANOMALY_IDENTIFICATION",
  "FACT_VS_ASSUMPTION",
  "PROFESSIONAL_STATUS_UPDATE",
  "ACTIONABLE_NEXT_STEP",
]);

function sourceType(value: string): SourceType {
  const normalized = value.toUpperCase();
  const accepted: SourceType[] = ["PDF", "DOCX", "MARKDOWN", "CSV", "VIDEO", "AUDIO", "ARTICLE", "WEB_PAGE", "REFERENCE", "GENERATED_SKILL", "GENERATED_NOTE", "OTHER"];
  return accepted.includes(normalized as SourceType) ? normalized as SourceType : "OTHER";
}

function rights(value: string) {
  if (value === "KNOWN") return "KNOWN" as const;
  if (value === "RESTRICTED") return "RESTRICTED" as const;
  return "UNKNOWN" as const;
}

export function excelCatalogResourceToSource(resource: ExcelCatalogResource, catalog: ExcelCatalog): SourceRecord {
  const catalogReference = `knowledge/catalog/excel-resources.json#${resource.resourceId}`;
  const mappedCompetencies = resource.competencies.filter((id): id is CompetencyId => competencyIds.has(id as CompetencyId));
  return {
    schemaVersion: 1,
    materialKind: "ORIGINAL_SOURCE",
    id: resource.resourceId,
    title: resource.title,
    sourceType: sourceType(resource.resourceType),
    domain: "Analyse de données",
    subject: "Excel",
    originalPathOrReference: catalogReference,
    classification: catalog.catalogPolicy.binaryClassification === "PERSONAL_LEARNING_ONLY" ? "PERSONAL" : "UNKNOWN",
    origin: "Bibliothèque Excel locale — métadonnées uniquement",
    author: resource.creator === "UNKNOWN" ? null : resource.creator,
    publisher: null,
    createdAt: null,
    updatedAt: null,
    language: resource.language,
    licenseStatus: rights(resource.licenseStatus),
    copyrightStatus: resource.redistributionAllowed ? "KNOWN" : "UNKNOWN",
    trust: {
      authority: "UNKNOWN",
      verification: resource.sourceQuality === "VERIFIED" ? "VERIFIED" : "UNVERIFIED",
      pedagogicalRelevance: resource.resourceId === "EXCEL-LOCAL-002" ? "HIGH" : "MEDIUM",
    },
    freshness: "UNKNOWN",
    status: "CATALOGUED",
    tags: [resource.topic, ...resource.subtopics],
    conceptIds: resource.resourceId === "EXCEL-LOCAL-002" ? ["CSV_DELIMITER", "CSV_IMPORT"] : [],
    competencyIds: mappedCompetencies,
    missionIds: resource.resourceId === "EXCEL-LOCAL-002" ? ["excel-csv-foundations-level-1-v1"] : [],
    notes: [resource.notes, "Le binaire local n’est ni lu, ni copié, ni publié."],
    provenance: {
      catalogReference,
      extractedFields: ["id", "title", "sourceType", "author", "language", "licenseStatus", "topic", "subtopics", "competencyIds"],
      inferredFields: ["domain", "subject", "conceptIds", "missionIds", "pedagogicalRelevance"],
    },
  };
}

export function adaptExcelCatalog(catalog: ExcelCatalog, selectedResourceIds: string[]) {
  const selected = new Set(selectedResourceIds);
  return catalog.resources.filter((resource) => selected.has(resource.resourceId)).map((resource) => excelCatalogResourceToSource(resource, catalog));
}
