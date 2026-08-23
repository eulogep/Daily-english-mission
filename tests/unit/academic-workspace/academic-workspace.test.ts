/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type { CourseClassificationDraft } from "../../../src/modules/academic-workspace/types.ts";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  academicQuizIsGrounded,
  askCourseAnswerIsGrounded,
  configuredAIProviders,
  continueAcademicQuiz,
  courseFormatFromFileName,
  createAcademicQuizAttempt,
  evaluateAcademicQuestion,
  nextAcademicDifficulty,
  pauseAcademicQuiz,
  planCourseIngestion,
  resumeAcademicQuiz,
  retryAcademicQuestion,
  revealAcademicHint,
  startAcademicQuiz,
  submitAcademicAnswer,
  validateCourseClassification,
} = require("../../../src/modules/academic-workspace/core.ts");
const { academicErrorSignals, academicEvidenceFromAttempt } = require("../../../src/modules/academic-workspace/integration.ts");
const { academicWorkspaceRegistry, networkingQuiz, networkingSection } = require("../../../src/modules/academic-workspace/pilot-registry.ts");
const { deriveCompetencyRecord } = require("../../../src/modules/learning-records/core.ts");
const { generateReviewItems, mergeErrorPatterns, reviewIsTraceable } = require("../../../src/modules/review-engine/core.ts");
const { sourceCanBeUsedExternally } = require("../../../src/modules/source-engine/core.ts");

const classification = (overrides: Partial<CourseClassificationDraft> = {}): CourseClassificationDraft => ({
  fileName: "course.pdf", format: "PDF", subjectId: "SUBJECT-NETWORKING", moduleId: "MODULE-NETWORK-FUNDAMENTALS",
  classification: "ACADEMIC_PERSONAL_USE", language: "fr", copyrightStatus: "UNKNOWN", ...overrides,
});

function completedAttempt() {
  let attempt = startAcademicQuiz(createAcademicQuizAttempt(networkingQuiz, 10, "academic-test"), 20);
  for (const question of networkingQuiz.questions) {
    attempt = submitAcademicAnswer(attempt, networkingQuiz, question.expectedResponse, 30 + attempt.currentQuestionIndex);
    attempt = continueAcademicQuiz(attempt, networkingQuiz, 40 + attempt.currentQuestionIndex);
  }
  return attempt;
}

test("A. workspace represents several subjects without inventing active content", () => {
  assert.ok(academicWorkspaceRegistry.subjects.length >= 5);
  assert.equal(academicWorkspaceRegistry.subjects.filter((subject: { status: string }) => subject.status === "ACTIVE").length, 1);
});

test("B. active subject resolves its real module", () => {
  const subject = academicWorkspaceRegistry.subjects.find((item: { slug: string }) => item.slug === "networking");
  assert.deepEqual(subject.moduleIds, ["MODULE-NETWORK-FUNDAMENTALS"]);
  assert.ok(academicWorkspaceRegistry.modules.some((module: { id: string }) => module.id === subject.moduleIds[0]));
});

test("C. academic source binaries remain personal-use metadata only", () => {
  assert.ok(academicWorkspaceRegistry.sources.every((source: { classification: string }) => source.classification === "ACADEMIC_PERSONAL_USE"));
  assert.ok(academicWorkspaceRegistry.ingestions.every((ingestion: { binaryCommitted: boolean }) => ingestion.binaryCommitted === false));
});

test("D. local PDF extraction is reported with bounded provenance", () => {
  const pdf = academicWorkspaceRegistry.ingestions.find((item: { format: string }) => item.format === "PDF");
  assert.equal(pdf.status, "PARTIALLY_EXTRACTED");
  assert.deepEqual(pdf.extractedSectionIds, ["SECTION-PDF-REFERENCE-MODELS", "SECTION-PDF-ENCAPSULATION"]);
  assert.equal(pdf.extractionMethod, "PDFJS_DIST_LOCAL");
  assert.equal(pdf.binaryCommitted, false);
});

test("E. bounded DOCX section retains exact source provenance", () => {
  assert.equal(networkingSection.verificationStatus, "VERIFIED_FROM_LOCAL_EXTRACTION");
  assert.match(networkingSection.sourceReference, /paragraphes 1 à 92/);
  assert.ok(networkingSection.sourceId);
});

test("F. supported ingestion formats are recognized", () => {
  assert.deepEqual(["course.pdf", "course.docx", "course.md", "course.txt", "course.csv"].map(courseFormatFromFileName), ["PDF", "DOCX", "MARKDOWN", "TEXT", "CSV"]);
  assert.equal(courseFormatFromFileName("course.exe"), null);
});

test("G. UNKNOWN classification blocks an ingestion plan", () => {
  const draft = classification({ classification: "UNKNOWN" });
  assert.equal(validateCourseClassification(draft).valid, false);
  assert.equal(planCourseIngestion(draft, true).status, "EXTRACTION_FAILED");
});

test("H. unavailable extractor never fabricates sections", () => {
  const plan = planCourseIngestion(classification(), false);
  assert.equal(plan.status, "EXTRACTION_FAILED");
  assert.deepEqual(plan.extractedSectionIds, []);
});

test("I. every quiz question is grounded to source section and concept", () => {
  assert.equal(academicQuizIsGrounded(networkingQuiz), true);
  assert.ok(networkingQuiz.questions.every((question: { generationMethod: string }) => question.generationMethod === "MANUAL_GROUNDED"));
});

test("J. a question without provenance is rejected as ungrounded", () => {
  const broken = { ...networkingQuiz, questions: [{ ...networkingQuiz.questions[0], sourceId: "" }] };
  assert.equal(academicQuizIsGrounded(broken), false);
});

test("K. deterministic evaluator accepts valid variations and rejects false answers", () => {
  assert.equal(evaluateAcademicQuestion(networkingQuiz.questions[2], "Le protocole DHCP"), true);
  assert.equal(evaluateAcademicQuestion(networkingQuiz.questions[2], "DNS"), false);
});

test("L. quiz lifecycle completes only after every correct response", () => {
  const attempt = completedAttempt();
  assert.equal(attempt.status, "COMPLETED");
  assert.equal(attempt.completedQuestionIds.length, networkingQuiz.questions.length);
});

test("M. retry and hint use remain explicit", () => {
  let attempt = startAcademicQuiz(createAcademicQuizAttempt(networkingQuiz, 1, "assist"), 2);
  attempt = submitAcademicAnswer(attempt, networkingQuiz, "physical", 3);
  attempt = retryAcademicQuestion(attempt, networkingQuiz, 4);
  attempt = revealAcademicHint(attempt, networkingQuiz, 5);
  assert.equal(attempt.retries["osi-ip-layer"], 1);
  assert.equal(attempt.hintsUsed["osi-ip-layer"], 1);
});

test("N. pause and resume preserve the current question and responses", () => {
  let attempt = startAcademicQuiz(createAcademicQuizAttempt(networkingQuiz, 1, "pause"), 2);
  attempt = { ...attempt, responses: { "osi-ip-layer": "network" } };
  const resumed = resumeAcademicQuiz(pauseAcademicQuiz(attempt, 3), 4);
  assert.equal(resumed.status, "IN_PROGRESS");
  assert.equal(resumed.responses["osi-ip-layer"], "network");
});

test("O. completed academic evidence is source-grounded and capped at PRACTICED", () => {
  const records = academicEvidenceFromAttempt(completedAttempt(), networkingQuiz);
  const completion = records.at(-1);
  assert.equal(completion.evaluationResult.academicGroundingStatus, "VERIFIED");
  assert.equal(deriveCompetencyRecord("NETWORK_FUNDAMENTALS", records).status, "PRACTICED");
});

test("P. an academic error creates one traceable review item", () => {
  let attempt = startAcademicQuiz(createAcademicQuizAttempt(networkingQuiz, 1, "wrong"), 2);
  attempt = submitAcademicAnswer(attempt, networkingQuiz, "physical", 3);
  const evidence = academicEvidenceFromAttempt(attempt, networkingQuiz);
  const signals = academicErrorSignals(attempt, networkingQuiz, evidence.map((item: { id: string }) => item.id));
  const patterns = mergeErrorPatterns([], signals);
  const items = generateReviewItems([], patterns, 4);
  assert.equal(items.length, 1);
  assert.equal(reviewIsTraceable(items[0], patterns, evidence), true);
});

test("Q. duplicate processing is idempotent at the error-pattern layer", () => {
  let attempt = startAcademicQuiz(createAcademicQuizAttempt(networkingQuiz, 1, "idem"), 2);
  attempt = submitAcademicAnswer(attempt, networkingQuiz, "physical", 3);
  const evidence = academicEvidenceFromAttempt(attempt, networkingQuiz);
  const signals = academicErrorSignals(attempt, networkingQuiz, evidence.map((item: { id: string }) => item.id));
  const once = mergeErrorPatterns([], signals);
  const twice = mergeErrorPatterns(once, signals);
  assert.deepEqual(twice, once);
});

test("R. difficulty recommendation uses evidence signals rather than XP", () => {
  assert.equal(nextAcademicDifficulty(completedAttempt()), "INCREASE");
  const assisted = { ...completedAttempt(), hintsUsed: { a: 1, b: 1 }, retries: { a: 2 } };
  assert.equal(nextAcademicDifficulty(assisted), "REINFORCE");
});

test("S. ask-course contract rejects citations outside the allowed course", () => {
  const safe = { answer: "IP relève de la couche réseau.", citations: [{ sourceId: networkingSection.sourceId, sectionId: networkingSection.id, sourceReference: networkingSection.sourceReference }], uncertainty: null, claims: [{ text: "IP relève de la couche réseau.", basis: "SOURCE" }] };
  assert.equal(askCourseAnswerIsGrounded(safe, [networkingSection.sourceId], [networkingSection.id]), true);
  assert.equal(askCourseAnswerIsGrounded({ ...safe, citations: [{ ...safe.citations[0], sourceId: "OTHER" }] }, [networkingSection.sourceId], [networkingSection.id]), false);
});

test("T. AI abstraction has no configured provider or network call", () => {
  assert.deepEqual(configuredAIProviders, []);
  const files = ["src/modules/academic-workspace/core.ts", "src/modules/academic-workspace/pilot-registry.ts", "src/modules/academic-workspace/integration.ts"];
  const content = files.map((file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n");
  assert.doesNotMatch(content, /fetch\(|axios|https?:\/\//i);
});

test("U. JSON refresh round trip preserves academic attempt history", () => {
  const original = completedAttempt();
  const restored = JSON.parse(JSON.stringify(original));
  assert.deepEqual(restored, original);
  assert.equal(restored.status, "COMPLETED");
});

test("V. source return navigation points to the exact pilot workspace", () => {
  const component = fs.readFileSync(path.join(process.cwd(), "src/components/academic-workspace/NetworkingWorkspace.tsx"), "utf8");
  const evidencePanel = fs.readFileSync(path.join(process.cwd(), "src/components/learning-records/LearningRecordPanels.tsx"), "utf8");
  assert.match(component, /sourceReference/);
  assert.match(evidencePanel, /\/subjects\/networking/);
});

test("W. original source and derived academic material cannot be confused", () => {
  assert.ok(academicWorkspaceRegistry.sources.every((source: { materialKind: string }) => source.materialKind === "ORIGINAL_SOURCE"));
  assert.equal(networkingSection.materialKind, "DERIVED_MATERIAL");
  assert.equal(networkingSection.canonical, false);
});

test("X. keys and protected company data remain excluded from external use", () => {
  const content = fs.readFileSync(path.join(process.cwd(), "src/modules/academic-workspace/core.ts"), "utf8");
  assert.doesNotMatch(content, /api[_-]?key|bearer\s+[a-z0-9]/i);
  const pilot = academicWorkspaceRegistry.sources[0];
  assert.equal(sourceCanBeUsedExternally({ ...pilot, classification: "COMPANY_INTERNAL" }), false);
  assert.equal(sourceCanBeUsedExternally({ ...pilot, classification: "COMPANY_RESTRICTED" }), false);
});
