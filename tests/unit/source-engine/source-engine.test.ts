/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type { ConceptRecord, SourceBundle, SourceRecord } from "../../../src/modules/source-engine/types.ts";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  bundlesForMission,
  conceptPrerequisitesAreValid,
  createDerivedArtifact,
  createSourceRecord,
  deduplicateSources,
  derivedArtifactHasValidProvenance,
  filterSources,
  isCanonicalMaterial,
  migrateSourceRecord,
  missionSourceLinkIsValid,
  prepareExternalBundle,
  recoverSourceRecords,
  sourceCanBeUsedExternally,
  validateConceptRecord,
  validateRegistry,
  validateSourceBundle,
  validateSourceConceptRelation,
  validateSourceRecord,
} = require("../../../src/modules/source-engine/core.ts");
const { adaptExcelCatalog, excelCatalogResourceToSource } = require("../../../src/modules/source-engine/excel-catalog-adapter.ts");
const { excelLevel1Mission } = require("../../../src/modules/mission-runtime/excel-level-1-mission.ts");

const catalog = JSON.parse(fs.readFileSync(path.join(process.cwd(), "knowledge/catalog/excel-resources.json"), "utf8"));

function source(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return createSourceRecord({
    id: "SOURCE-1",
    title: "Source synthétique",
    sourceType: "CSV",
    domain: "Données",
    subject: "Excel",
    originalPathOrReference: "/training.csv",
    classification: "TRAINING_SYNTHETIC",
    origin: "Projet local",
    author: null,
    publisher: null,
    createdAt: null,
    updatedAt: null,
    language: "fr",
    licenseStatus: "KNOWN",
    copyrightStatus: "KNOWN",
    trust: { authority: "OFFICIAL", verification: "VERIFIED", pedagogicalRelevance: "HIGH" },
    freshness: "CURRENT",
    status: "VERIFIED",
    tags: ["csv", "excel"],
    conceptIds: ["CSV_DELIMITER"],
    competencyIds: ["EXCEL_CSV_IMPORT"],
    missionIds: ["mission-1"],
    notes: ["Fixture TRAINING_SYNTHETIC."],
    provenance: { catalogReference: null, extractedFields: ["title"], inferredFields: ["conceptIds"] },
    ...overrides,
  });
}

function concept(overrides: Partial<ConceptRecord> = {}): ConceptRecord {
  return {
    schemaVersion: 1,
    id: "CSV_DELIMITER",
    name: "Délimiteur CSV",
    domain: "Données",
    description: "Sépare les champs.",
    prerequisiteConceptIds: [],
    relatedConceptIds: [],
    sourceIds: ["SOURCE-1"],
    competencyIds: ["EXCEL_CSV_IMPORT"],
    status: "ACTIVE",
    ...overrides,
  };
}

function bundle(overrides: Partial<SourceBundle> = {}): SourceBundle {
  return {
    schemaVersion: 1,
    id: "BUNDLE-1",
    title: "Bundle CSV",
    purpose: "Mission locale",
    sourceIds: ["SOURCE-1"],
    derivedArtifactIds: ["ARTIFACT-1"],
    conceptIds: ["CSV_DELIMITER"],
    allowedUse: ["LOCAL_LEARNING", "MISSION_CONTEXT"],
    classification: "TRAINING_SYNTHETIC",
    notes: [],
    ...overrides,
  };
}

const artifact = () => createDerivedArtifact({
  id: "ARTIFACT-1",
  type: "SKILL",
  title: "Mission dérivée",
  sourceIds: ["SOURCE-1"],
  conceptIds: ["CSV_DELIMITER"],
  createdAt: "2026-08-23T00:00:00.000Z",
  generationMethod: "APPLICATION_CONFIGURATION",
  generator: "Test local",
  verificationStatus: "VERIFIED",
  localReference: "fixture.ts",
});

test("A. source creation produces a valid canonical record", () => {
  const record = source();
  assert.equal(validateSourceRecord(record), true);
  assert.equal(record.materialKind, "ORIGINAL_SOURCE");
});

test("B. malformed source validation fails", () => {
  assert.equal(validateSourceRecord({ id: "broken" }), false);
});

test("C. original and derived materials remain distinct", () => {
  assert.equal(isCanonicalMaterial(source()), true);
  assert.equal(isCanonicalMaterial(artifact()), false);
});

test("D. derived provenance is preserved and resolvable", () => {
  const derived = artifact();
  assert.deepEqual(derived.sourceIds, ["SOURCE-1"]);
  assert.equal(derivedArtifactHasValidProvenance(derived, [source()]), true);
});

test("E. source to concept relation requires explicit valid endpoints", () => {
  const relation = { sourceId: "SOURCE-1", conceptId: "CSV_DELIMITER", support: "SUPPORTED", rationale: "Le CSV expose le délimiteur." };
  assert.equal(validateSourceConceptRelation(relation, [source()], [concept()]), true);
  assert.equal(validateSourceConceptRelation({ ...relation, support: "INFERRED" }, [source()], [concept()]), true);
});

test("F. concept prerequisite relation rejects missing and self references", () => {
  const importConcept = concept({ id: "CSV_IMPORT", name: "Import CSV", prerequisiteConceptIds: ["CSV_DELIMITER"] });
  assert.equal(validateConceptRecord(importConcept), true);
  assert.equal(conceptPrerequisitesAreValid([concept(), importConcept]), true);
  assert.equal(conceptPrerequisitesAreValid([concept({ prerequisiteConceptIds: ["CSV_DELIMITER"] })]), false);
});

test("G. source bundle creation validates every referenced record", () => {
  const registry = { sources: [source()], concepts: [concept()], derivedArtifacts: [artifact()] };
  assert.equal(validateSourceBundle(bundle(), registry), true);
  assert.equal(validateSourceBundle(bundle({ sourceIds: ["MISSING"] }), registry), false);
});

test("H. mission to source bundle relation is explicit", () => {
  const registry = { schemaVersion: 1, sources: [source()], concepts: [concept()], relations: [], derivedArtifacts: [artifact()], bundles: [bundle()], missionLinks: [{ missionId: "mission-1", sourceBundleIds: ["BUNDLE-1"] }] };
  assert.equal(missionSourceLinkIsValid(registry.missionLinks[0], registry.bundles), true);
  assert.equal(bundlesForMission("mission-1", registry)[0].id, "BUNDLE-1");
});

test("I. UNKNOWN copyright from the Excel catalogue remains UNKNOWN", () => {
  const resource = catalog.resources.find((item: { resourceId: string }) => item.resourceId === "EXCEL-LOCAL-002");
  const adapted = excelCatalogResourceToSource(resource, catalog);
  assert.equal(adapted.copyrightStatus, "UNKNOWN");
  assert.equal(adapted.licenseStatus, "UNKNOWN");
});

test("J. company classifications are blocked from external use", () => {
  assert.equal(sourceCanBeUsedExternally(source({ classification: "COMPANY_INTERNAL" })), false);
  assert.equal(sourceCanBeUsedExternally(source({ classification: "COMPANY_RESTRICTED" })), false);
});

test("K. generated artifact can never become canonical automatically", () => {
  const derived = createDerivedArtifact({ ...artifact(), id: "ARTIFACT-2" });
  assert.equal(derived.canonical, false);
  assert.equal(derived.materialKind, "DERIVED_MATERIAL");
});

test("L. Excel catalogue adapter reuses redacted metadata only", () => {
  const [adapted] = adaptExcelCatalog(catalog, ["EXCEL-LOCAL-002"]);
  assert.equal(adapted.id, "EXCEL-LOCAL-002");
  assert.equal(adapted.originalPathOrReference, "knowledge/catalog/excel-resources.json#EXCEL-LOCAL-002");
  assert.equal(adapted.conceptIds.includes("CSV_DELIMITER"), true);
  assert.doesNotMatch(adapted.originalPathOrReference, /\.mp4|\.mp3|\.docx/i);
});

test("M. local filtering searches title, tags, subject and source type", () => {
  const values = [source(), source({ id: "SOURCE-2", title: "Guide réseau", sourceType: "MARKDOWN", subject: "Réseau", tags: ["TCP"] })];
  assert.deepEqual(filterSources(values, { query: "excel" }).map((item: SourceRecord) => item.id), ["SOURCE-1"]);
  assert.deepEqual(filterSources(values, { subject: "Réseau", sourceType: "MARKDOWN" }).map((item: SourceRecord) => item.id), ["SOURCE-2"]);
});

test("N. duplicate source handling keeps one canonical record", () => {
  const result = deduplicateSources([source(), source({ title: "Duplicate" })]);
  assert.equal(result.sources.length, 1);
  assert.deepEqual(result.duplicateIds, ["SOURCE-1"]);
});

test("O. schema version compatibility migrates legacy v0 safely", () => {
  const current = source();
  const { schemaVersion: _schemaVersion, materialKind: _materialKind, ...legacy } = current;
  const migrated = migrateSourceRecord({ ...legacy, schemaVersion: 0 });
  assert.equal(migrated?.schemaVersion, 1);
  assert.equal(migrated?.materialKind, "ORIGINAL_SOURCE");
});

test("P. malformed source recovery preserves valid records", () => {
  const result = recoverSourceRecords([source(), { id: "broken" }]);
  assert.equal(result.sources.length, 1);
  assert.deepEqual(result.rejectedIndexes, [1]);
});

test("Q. copyrighted local binaries are absent from adapted source references", () => {
  assert.equal(catalog.resources.every((item: { localPath: string | null }) => item.localPath === null), true);
  const adapted = adaptExcelCatalog(catalog, catalog.resources.map((item: { resourceId: string }) => item.resourceId));
  assert.equal(adapted.some((item: SourceRecord) => /\.(mp4|mov|mp3|wav|docx|pdf)$/i.test(item.originalPathOrReference ?? "")), false);
});

test("R. Source Engine has no external network dependency", () => {
  const files = ["src/modules/source-engine/core.ts", "src/modules/source-engine/excel-catalog-adapter.ts", "src/modules/source-engine/pilot-registry.ts"];
  const serialized = files.map((file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n");
  assert.doesNotMatch(serialized, /fetch\(|axios|https?:\/\//i);
});

test("S. external bundle preparation authorizes only safe sources", () => {
  const synthetic = source();
  const local = source({ id: "LOCAL", classification: "PERSONAL", copyrightStatus: "UNKNOWN", licenseStatus: "UNKNOWN" });
  const prepared = prepareExternalBundle(bundle({ sourceIds: ["SOURCE-1", "LOCAL"], derivedArtifactIds: [] }), [synthetic, local]);
  assert.deepEqual(prepared.authorizedSourceIds, ["SOURCE-1"]);
  assert.deepEqual(prepared.blockedSourceIds, ["LOCAL"]);
});

test("T. complete registry validation preserves semantic contracts", () => {
  const registry = {
    schemaVersion: 1,
    sources: [source()],
    concepts: [concept()],
    relations: [{ sourceId: "SOURCE-1", conceptId: "CSV_DELIMITER", support: "SUPPORTED", rationale: "Fixture explicite." }],
    derivedArtifacts: [artifact()],
    bundles: [bundle()],
    missionLinks: [{ missionId: "mission-1", sourceBundleIds: ["BUNDLE-1"] }],
  };
  assert.equal(validateRegistry(registry), true);
});

test("U. Excel mission declares its controlled source bundle", () => {
  assert.deepEqual(excelLevel1Mission.sourceBundleIds, ["EXCEL_CSV_IMPORT_FOUNDATIONS"]);
});
