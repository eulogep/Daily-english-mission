import type { CompetencyId } from "../learning-records/types";

export const SOURCE_ENGINE_SCHEMA_VERSION = 1 as const;

export type SourceType =
  | "PDF" | "DOCX" | "MARKDOWN" | "CSV" | "VIDEO" | "AUDIO"
  | "ARTICLE" | "WEB_PAGE" | "REFERENCE" | "GENERATED_SKILL"
  | "GENERATED_NOTE" | "OTHER";
export type SourceStatus = "DISCOVERED" | "CATALOGUED" | "VERIFIED" | "PARTIALLY_VERIFIED" | "DEPRECATED" | "BLOCKED";
export type DataClassification = "PUBLIC" | "TRAINING_SYNTHETIC" | "ACADEMIC_PERSONAL_USE" | "PERSONAL" | "COMPANY_INTERNAL" | "COMPANY_RESTRICTED" | "UNKNOWN";
export type Authority = "OFFICIAL" | "ESTABLISHED" | "COMMUNITY" | "UNKNOWN";
export type SourceVerification = "VERIFIED" | "PARTIAL" | "UNVERIFIED";
export type RightsStatus = "KNOWN" | "UNKNOWN" | "RESTRICTED";
export type Freshness = "CURRENT" | "POSSIBLY_OUTDATED" | "HISTORICAL" | "UNKNOWN";
export type PedagogicalRelevance = "HIGH" | "MEDIUM" | "LOW";
export type SourceConceptSupport = "SUPPORTED" | "PARTIALLY_SUPPORTED" | "MENTIONED" | "INFERRED";

export type SourceProvenance = {
  catalogReference: string | null;
  extractedFields: string[];
  inferredFields: string[];
};

export type SourceTrust = {
  authority: Authority;
  verification: SourceVerification;
  pedagogicalRelevance: PedagogicalRelevance;
};

export type SourceRecord = {
  schemaVersion: typeof SOURCE_ENGINE_SCHEMA_VERSION;
  materialKind: "ORIGINAL_SOURCE";
  id: string;
  title: string;
  sourceType: SourceType;
  domain: string;
  subject: string;
  originalPathOrReference: string | null;
  classification: DataClassification;
  origin: string;
  author: string | null;
  publisher: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  language: string;
  licenseStatus: RightsStatus;
  copyrightStatus: RightsStatus;
  trust: SourceTrust;
  freshness: Freshness;
  status: SourceStatus;
  tags: string[];
  conceptIds: string[];
  competencyIds: CompetencyId[];
  missionIds: string[];
  notes: string[];
  provenance: SourceProvenance;
};

export type ConceptRecord = {
  schemaVersion: typeof SOURCE_ENGINE_SCHEMA_VERSION;
  id: string;
  name: string;
  domain: string;
  description: string;
  prerequisiteConceptIds: string[];
  relatedConceptIds: string[];
  sourceIds: string[];
  competencyIds: CompetencyId[];
  status: "ACTIVE" | "DRAFT" | "DEPRECATED";
};

export type SourceConceptRelation = {
  sourceId: string;
  conceptId: string;
  support: SourceConceptSupport;
  rationale: string;
};

export type DerivedArtifactType = "SUMMARY" | "CHEAT_SHEET" | "FLASHCARDS" | "QUIZ" | "SKILL" | "NOTE" | "SLIDES" | "AUDIO_GUIDE" | "VIDEO_GUIDE";
export type GenerationMethod = "MANUAL_SUMMARY" | "APPLICATION_CONFIGURATION" | "NOTEBOOKLM_MANUAL" | "AI_ASSISTED" | "OTHER";

export type DerivedArtifact = {
  schemaVersion: typeof SOURCE_ENGINE_SCHEMA_VERSION;
  materialKind: "DERIVED_MATERIAL";
  canonical: false;
  id: string;
  type: DerivedArtifactType;
  title: string;
  sourceIds: string[];
  conceptIds: string[];
  createdAt: string;
  generationMethod: GenerationMethod;
  generator: string;
  verificationStatus: "VERIFIED" | "PARTIALLY_VERIFIED" | "NOT_INDEPENDENTLY_VERIFIED";
  localReference: string | null;
};

export type SourceBundle = {
  schemaVersion: typeof SOURCE_ENGINE_SCHEMA_VERSION;
  id: string;
  title: string;
  purpose: string;
  sourceIds: string[];
  derivedArtifactIds: string[];
  conceptIds: string[];
  allowedUse: Array<"LOCAL_LEARNING" | "MISSION_CONTEXT" | "FUTURE_NOTEBOOKLM_INPUT">;
  classification: DataClassification;
  notes: string[];
};

export type MissionSourceLink = {
  missionId: string;
  sourceBundleIds: string[];
};

export type SourceEngineRegistry = {
  schemaVersion: typeof SOURCE_ENGINE_SCHEMA_VERSION;
  sources: SourceRecord[];
  concepts: ConceptRecord[];
  relations: SourceConceptRelation[];
  derivedArtifacts: DerivedArtifact[];
  bundles: SourceBundle[];
  missionLinks: MissionSourceLink[];
};

export type ExcelCatalogResource = {
  resourceId: string;
  title: string;
  resourceType: string;
  creator: string;
  sourceUrl: string | null;
  localPath: string | null;
  topic: string;
  subtopics: string[];
  language: string;
  competencies: string[];
  sourceQuality: string;
  licenseStatus: string;
  redistributionAllowed: boolean;
  notes: string;
};

export type ExcelCatalog = {
  schemaVersion: number;
  catalogPolicy: {
    binaryClassification: string;
    localPathExposure: string;
    defaultLicenseStatus: string;
    defaultRedistributionAllowed: boolean;
  };
  resources: ExcelCatalogResource[];
};
