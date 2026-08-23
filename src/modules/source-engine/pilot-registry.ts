import excelCatalogJson from "../../../knowledge/catalog/excel-resources.json";
import { createDerivedArtifact, createSourceRecord, validateRegistry } from "./core";
import { adaptExcelCatalog } from "./excel-catalog-adapter";
import { SOURCE_ENGINE_SCHEMA_VERSION, type ConceptRecord, type ExcelCatalog, type SourceEngineRegistry } from "./types";

const excelCatalog = excelCatalogJson as ExcelCatalog;
const [delimiterVideoMetadata] = adaptExcelCatalog(excelCatalog, ["EXCEL-LOCAL-002"]);

const trainingCsv = createSourceRecord({
  id: "ELOS-SYNTHETIC-CSV-L1",
  title: "Jeu d’entraînement CSV — Excel niveau 1",
  sourceType: "CSV",
  domain: "Analyse de données",
  subject: "Excel",
  originalPathOrReference: "/training-data/excel-csv-foundations/level-1-import.csv",
  classification: "TRAINING_SYNTHETIC",
  origin: "Engineer Learning OS",
  author: "Engineer Learning OS",
  publisher: null,
  createdAt: null,
  updatedAt: null,
  language: "en",
  licenseStatus: "KNOWN",
  copyrightStatus: "KNOWN",
  trust: { authority: "OFFICIAL", verification: "VERIFIED", pedagogicalRelevance: "HIGH" },
  freshness: "CURRENT",
  status: "VERIFIED",
  tags: ["CSV", "délimiteur", "import Excel", "aperçu des données"],
  conceptIds: ["CSV_DELIMITER", "CSV_IMPORT", "DATA_PREVIEW"],
  competencyIds: ["EXCEL_CSV_IMPORT"],
  missionIds: ["excel-csv-foundations-level-1-v1"],
  notes: ["Dataset généré pour l’entraînement; il ne contient aucune donnée réelle."],
  provenance: {
    catalogReference: null,
    extractedFields: ["columns", "rows", "classification"],
    inferredFields: ["conceptIds", "missionIds", "pedagogicalRelevance"],
  },
});

const governancePlan = createSourceRecord({
  id: "ELOS-EXCEL-LIBRARY-PLAN",
  title: "Excel Resource Library — Future Ingestion Plan",
  sourceType: "MARKDOWN",
  domain: "Gouvernance des connaissances",
  subject: "Sources",
  originalPathOrReference: "docs/knowledge/EXCEL_RESOURCE_LIBRARY_PLAN.md",
  classification: "PERSONAL",
  origin: "Documentation locale du projet",
  author: null,
  publisher: null,
  createdAt: null,
  updatedAt: null,
  language: "en",
  licenseStatus: "UNKNOWN",
  copyrightStatus: "UNKNOWN",
  trust: { authority: "OFFICIAL", verification: "PARTIAL", pedagogicalRelevance: "HIGH" },
  freshness: "CURRENT",
  status: "PARTIALLY_VERIFIED",
  tags: ["provenance", "copyright", "catalogue Excel", "ingestion"],
  conceptIds: ["SOURCE_PROVENANCE"],
  competencyIds: [],
  missionIds: [],
  notes: ["Document de gouvernance local; il ne confère aucun droit sur les ressources cataloguées."],
  provenance: {
    catalogReference: "docs/knowledge/EXCEL_RESOURCE_LIBRARY_PLAN.md",
    extractedFields: ["inventoryPolicy", "safetyBoundary", "ingestionGates"],
    inferredFields: ["conceptIds", "pedagogicalRelevance"],
  },
});

const concepts: ConceptRecord[] = [
  {
    schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION,
    id: "CSV_DELIMITER",
    name: "Délimiteur CSV",
    domain: "Analyse de données",
    description: "Caractère qui sépare les champs d’une ligne CSV.",
    prerequisiteConceptIds: [],
    relatedConceptIds: ["CSV_IMPORT", "DATA_PREVIEW"],
    sourceIds: [delimiterVideoMetadata.id, trainingCsv.id],
    competencyIds: ["EXCEL_CSV_IMPORT"],
    status: "ACTIVE",
  },
  {
    schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION,
    id: "CSV_IMPORT",
    name: "Import CSV",
    domain: "Analyse de données",
    description: "Import contrôlé d’un fichier CSV dans un tableur.",
    prerequisiteConceptIds: ["CSV_DELIMITER"],
    relatedConceptIds: ["DATA_PREVIEW"],
    sourceIds: [delimiterVideoMetadata.id, trainingCsv.id],
    competencyIds: ["EXCEL_CSV_IMPORT"],
    status: "ACTIVE",
  },
  {
    schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION,
    id: "DATA_PREVIEW",
    name: "Aperçu des données",
    domain: "Analyse de données",
    description: "Contrôle visuel des colonnes et types avant chargement.",
    prerequisiteConceptIds: ["CSV_DELIMITER"],
    relatedConceptIds: ["CSV_IMPORT"],
    sourceIds: [trainingCsv.id],
    competencyIds: ["EXCEL_CSV_IMPORT"],
    status: "ACTIVE",
  },
  {
    schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION,
    id: "SOURCE_PROVENANCE",
    name: "Provenance d’une source",
    domain: "Gouvernance des connaissances",
    description: "Lien explicite entre une information, sa source canonique et ses dérivés.",
    prerequisiteConceptIds: [],
    relatedConceptIds: [],
    sourceIds: [governancePlan.id],
    competencyIds: [],
    status: "ACTIVE",
  },
];

const missionArtifact = createDerivedArtifact({
  id: "DERIVED-EXCEL-L1-MISSION",
  type: "SKILL",
  title: "Mission guidée Excel CSV Foundations — Niveau 1",
  sourceIds: [trainingCsv.id, delimiterVideoMetadata.id],
  conceptIds: ["CSV_DELIMITER", "CSV_IMPORT", "DATA_PREVIEW"],
  createdAt: "2026-08-23T00:00:00.000Z",
  generationMethod: "APPLICATION_CONFIGURATION",
  generator: "Engineer Learning OS",
  verificationStatus: "VERIFIED",
  localReference: "src/modules/mission-runtime/excel-level-1-mission.ts",
});

export const sourceEngineRegistry: SourceEngineRegistry = {
  schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION,
  sources: [delimiterVideoMetadata, trainingCsv, governancePlan],
  concepts,
  relations: [
    { sourceId: delimiterVideoMetadata.id, conceptId: "CSV_DELIMITER", support: "SUPPORTED", rationale: "Le catalogue décrit une démonstration de séparation par délimiteur." },
    { sourceId: delimiterVideoMetadata.id, conceptId: "CSV_IMPORT", support: "PARTIALLY_SUPPORTED", rationale: "La ressource aide au diagnostic de colonnes mais ne couvre pas tout le workflow d’import." },
    { sourceId: trainingCsv.id, conceptId: "CSV_DELIMITER", support: "SUPPORTED", rationale: "Le fichier utilise explicitement la virgule comme délimiteur." },
    { sourceId: trainingCsv.id, conceptId: "DATA_PREVIEW", support: "SUPPORTED", rationale: "Le dataset synthétique permet de vérifier le découpage des colonnes." },
    { sourceId: governancePlan.id, conceptId: "SOURCE_PROVENANCE", support: "SUPPORTED", rationale: "Le plan définit les frontières de catalogue, droits et ingestion." },
  ],
  derivedArtifacts: [missionArtifact],
  bundles: [{
    schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION,
    id: "EXCEL_CSV_IMPORT_FOUNDATIONS",
    title: "Fondations de l’import CSV dans Excel",
    purpose: "Fournir à la mission Excel Niveau 1 un ensemble minimal, traçable et local.",
    sourceIds: [trainingCsv.id, delimiterVideoMetadata.id],
    derivedArtifactIds: [missionArtifact.id],
    conceptIds: ["CSV_DELIMITER", "CSV_IMPORT", "DATA_PREVIEW"],
    allowedUse: ["LOCAL_LEARNING", "MISSION_CONTEXT", "FUTURE_NOTEBOOKLM_INPUT"],
    classification: "PERSONAL",
    notes: ["Toute utilisation externe future doit exclure la ressource locale aux droits inconnus ou demander une validation humaine."],
  }],
  missionLinks: [{ missionId: "excel-csv-foundations-level-1-v1", sourceBundleIds: ["EXCEL_CSV_IMPORT_FOUNDATIONS"] }],
};

if (!validateRegistry(sourceEngineRegistry)) throw new Error("INVALID_SOURCE_ENGINE_PILOT_REGISTRY");
