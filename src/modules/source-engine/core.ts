import type {
  ConceptRecord,
  DataClassification,
  DerivedArtifact,
  MissionSourceLink,
  SourceBundle,
  SourceConceptRelation,
  SourceEngineRegistry,
  SourceRecord,
} from "./types";

const SOURCE_ENGINE_SCHEMA_VERSION = 1 as const;
const sourceTypes = new Set(["PDF", "DOCX", "MARKDOWN", "CSV", "VIDEO", "AUDIO", "ARTICLE", "WEB_PAGE", "REFERENCE", "GENERATED_SKILL", "GENERATED_NOTE", "OTHER"]);
const classifications = new Set(["PUBLIC", "TRAINING_SYNTHETIC", "ACADEMIC_PERSONAL_USE", "PERSONAL", "COMPANY_INTERNAL", "COMPANY_RESTRICTED", "UNKNOWN"]);
const statuses = new Set(["DISCOVERED", "CATALOGUED", "VERIFIED", "PARTIALLY_VERIFIED", "DEPRECATED", "BLOCKED"]);
const supportLevels = new Set(["SUPPORTED", "PARTIALLY_SUPPORTED", "MENTIONED", "INFERRED"]);

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function validateSourceRecord(value: unknown): value is SourceRecord {
  if (!object(value) || value.schemaVersion !== SOURCE_ENGINE_SCHEMA_VERSION || value.materialKind !== "ORIGINAL_SOURCE") return false;
  if (typeof value.id !== "string" || !value.id || typeof value.title !== "string" || !value.title) return false;
  if (!sourceTypes.has(String(value.sourceType)) || !classifications.has(String(value.classification)) || !statuses.has(String(value.status))) return false;
  if (!object(value.trust) || !["OFFICIAL", "ESTABLISHED", "COMMUNITY", "UNKNOWN"].includes(String(value.trust.authority))) return false;
  if (!["VERIFIED", "PARTIAL", "UNVERIFIED"].includes(String(value.trust.verification))) return false;
  if (!["HIGH", "MEDIUM", "LOW"].includes(String(value.trust.pedagogicalRelevance))) return false;
  if (!object(value.provenance) || !strings(value.provenance.extractedFields) || !strings(value.provenance.inferredFields)) return false;
  return strings(value.tags) && strings(value.conceptIds) && strings(value.competencyIds) && strings(value.missionIds) && strings(value.notes);
}

export function createSourceRecord(input: Omit<SourceRecord, "schemaVersion" | "materialKind">): SourceRecord {
  const source: SourceRecord = { ...input, schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION, materialKind: "ORIGINAL_SOURCE" };
  if (!validateSourceRecord(source)) throw new Error("INVALID_SOURCE_RECORD");
  return source;
}

export function migrateSourceRecord(value: unknown): SourceRecord | null {
  if (validateSourceRecord(value)) return value;
  if (!object(value) || (value.schemaVersion !== 0 && value.schemaVersion !== undefined)) return null;
  const migrated = { ...value, schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION, materialKind: "ORIGINAL_SOURCE" };
  return validateSourceRecord(migrated) ? migrated : null;
}

export function recoverSourceRecords(values: unknown[]) {
  const recovered: SourceRecord[] = [];
  const rejectedIndexes: number[] = [];
  values.forEach((value, index) => {
    const source = migrateSourceRecord(value);
    if (source) recovered.push(source);
    else rejectedIndexes.push(index);
  });
  return { sources: deduplicateSources(recovered).sources, rejectedIndexes };
}

export function deduplicateSources(sources: SourceRecord[]) {
  const byId = new Map<string, SourceRecord>();
  const duplicateIds: string[] = [];
  sources.forEach((source) => {
    if (byId.has(source.id)) duplicateIds.push(source.id);
    else byId.set(source.id, source);
  });
  return { sources: [...byId.values()], duplicateIds: [...new Set(duplicateIds)] };
}

export function validateConceptRecord(value: unknown): value is ConceptRecord {
  if (!object(value) || value.schemaVersion !== SOURCE_ENGINE_SCHEMA_VERSION) return false;
  return typeof value.id === "string" && Boolean(value.id)
    && typeof value.name === "string" && Boolean(value.name)
    && strings(value.prerequisiteConceptIds)
    && strings(value.relatedConceptIds)
    && strings(value.sourceIds)
    && strings(value.competencyIds)
    && ["ACTIVE", "DRAFT", "DEPRECATED"].includes(String(value.status));
}

export function validateSourceConceptRelation(relation: SourceConceptRelation, sources: SourceRecord[], concepts: ConceptRecord[]) {
  return sources.some((source) => source.id === relation.sourceId)
    && concepts.some((concept) => concept.id === relation.conceptId)
    && supportLevels.has(relation.support)
    && relation.rationale.trim().length > 0;
}

export function conceptPrerequisitesAreValid(concepts: ConceptRecord[]) {
  const ids = new Set(concepts.map((concept) => concept.id));
  return concepts.every((concept) => concept.prerequisiteConceptIds.every((id) => id !== concept.id && ids.has(id)));
}

export function createDerivedArtifact(input: Omit<DerivedArtifact, "schemaVersion" | "materialKind" | "canonical">): DerivedArtifact {
  return { ...input, schemaVersion: SOURCE_ENGINE_SCHEMA_VERSION, materialKind: "DERIVED_MATERIAL", canonical: false };
}

export function isCanonicalMaterial(value: SourceRecord | DerivedArtifact) {
  return value.materialKind === "ORIGINAL_SOURCE";
}

export function derivedArtifactHasValidProvenance(artifact: DerivedArtifact, sources: SourceRecord[]) {
  const sourceIds = new Set(sources.map((source) => source.id));
  return artifact.sourceIds.length > 0 && artifact.sourceIds.every((id) => sourceIds.has(id));
}

export function validateSourceBundle(bundle: SourceBundle, registry: Pick<SourceEngineRegistry, "sources" | "concepts" | "derivedArtifacts">) {
  const sourceIds = new Set(registry.sources.map((source) => source.id));
  const conceptIds = new Set(registry.concepts.map((concept) => concept.id));
  const artifactIds = new Set(registry.derivedArtifacts.map((artifact) => artifact.id));
  return bundle.schemaVersion === SOURCE_ENGINE_SCHEMA_VERSION
    && bundle.sourceIds.length > 0
    && bundle.sourceIds.every((id) => sourceIds.has(id))
    && bundle.conceptIds.every((id) => conceptIds.has(id))
    && bundle.derivedArtifactIds.every((id) => artifactIds.has(id));
}

export function bundlesForMission(missionId: string, registry: SourceEngineRegistry) {
  const linked = new Set(registry.missionLinks.find((link) => link.missionId === missionId)?.sourceBundleIds ?? []);
  return registry.bundles.filter((bundle) => linked.has(bundle.id));
}

export function missionSourceLinkIsValid(link: MissionSourceLink, bundles: SourceBundle[]) {
  const ids = new Set(bundles.map((bundle) => bundle.id));
  return link.sourceBundleIds.length > 0 && link.sourceBundleIds.every((id) => ids.has(id));
}

export function sourceCanBeUsedExternally(source: SourceRecord) {
  const safeClassification = source.classification === "PUBLIC" || source.classification === "TRAINING_SYNTHETIC";
  return safeClassification && source.copyrightStatus === "KNOWN" && source.licenseStatus === "KNOWN";
}

export function prepareExternalBundle(bundle: SourceBundle, sources: SourceRecord[]) {
  const selected = sources.filter((source) => bundle.sourceIds.includes(source.id));
  return {
    bundleId: bundle.id,
    authorizedSourceIds: selected.filter(sourceCanBeUsedExternally).map((source) => source.id),
    blockedSourceIds: selected.filter((source) => !sourceCanBeUsedExternally(source)).map((source) => source.id),
  };
}

export function filterSources(sources: SourceRecord[], options: { query?: string; subject?: string; sourceType?: string; conceptId?: string }) {
  const query = options.query?.trim().toLocaleLowerCase("fr-FR") ?? "";
  return sources.filter((source) => {
    const searchable = [source.title, source.subject, source.domain, source.origin, ...source.tags].join(" ").toLocaleLowerCase("fr-FR");
    return (!query || searchable.includes(query))
      && (!options.subject || source.subject === options.subject)
      && (!options.sourceType || source.sourceType === options.sourceType)
      && (!options.conceptId || source.conceptIds.includes(options.conceptId));
  });
}

export function validateRegistry(registry: SourceEngineRegistry) {
  const unique = deduplicateSources(registry.sources);
  return registry.schemaVersion === SOURCE_ENGINE_SCHEMA_VERSION
    && unique.duplicateIds.length === 0
    && registry.sources.every(validateSourceRecord)
    && registry.concepts.every(validateConceptRecord)
    && conceptPrerequisitesAreValid(registry.concepts)
    && registry.relations.every((relation) => validateSourceConceptRelation(relation, registry.sources, registry.concepts))
    && registry.derivedArtifacts.every((artifact) => !artifact.canonical && derivedArtifactHasValidProvenance(artifact, registry.sources))
    && registry.bundles.every((bundle) => validateSourceBundle(bundle, registry))
    && registry.missionLinks.every((link) => missionSourceLinkIsValid(link, registry.bundles));
}

export function mostRestrictiveClassification(classificationsToCombine: DataClassification[]): DataClassification {
  const order: DataClassification[] = ["PUBLIC", "TRAINING_SYNTHETIC", "PERSONAL", "ACADEMIC_PERSONAL_USE", "UNKNOWN", "COMPANY_INTERNAL", "COMPANY_RESTRICTED"];
  return classificationsToCombine.reduce((result, current) => order.indexOf(current) > order.indexOf(result) ? current : result, "PUBLIC");
}
