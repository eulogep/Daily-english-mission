/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
// @ts-nocheck
const assert = require("node:assert/strict");
const test = require("node:test");

const {
  academicQuizOutcome,
  closeAcademicRemediation,
  createAcademicQuizAttempt,
  retryAcademicQuestion,
  selectAcademicRemediation,
  startAcademicQuiz,
  submitAcademicAnswer,
} = require("../../../src/modules/academic-workspace/core.ts");
const {
  coverageFromGroundedQuestions,
  recommendedRemediation,
  remediationMethod,
  remediationSupport,
} = require("../../../src/modules/academic-workspace/remediation.ts");
const {
  networkingPdfSectionQuizzes,
} = require("../../../src/modules/academic-workspace/pilot-registry.ts");
const {
  academicErrorSignals,
  academicEvidenceFromAttempt,
} = require("../../../src/modules/academic-workspace/integration.ts");
const {
  generateReviewItems,
  mergeErrorPatterns,
} = require("../../../src/modules/review-engine/core.ts");

const sectionOneQuiz = networkingPdfSectionQuizzes[0];
const sectionTwoQuiz = networkingPdfSectionQuizzes[1];

function threeFailures() {
  let attempt = startAcademicQuiz(createAcademicQuizAttempt(sectionTwoQuiz, 1, "hf1-remediation"), 2);
  attempt = submitAcademicAnswer(attempt, sectionTwoQuiz, "frame", 3);
  attempt = retryAcademicQuestion(attempt, sectionTwoQuiz, 4);
  attempt = submitAcademicAnswer(attempt, sectionTwoQuiz, "frame", 5);
  attempt = retryAcademicQuestion(attempt, sectionTwoQuiz, 6);
  return submitAcademicAnswer(attempt, sectionTwoQuiz, "frame", 7);
}

test("A. Section 1 quiz only uses Section 1 sources", () => {
  assert.equal(sectionOneQuiz.sectionCoverage, "FULL");
  assert.ok(sectionOneQuiz.questions.every((question) => question.sectionId === "SECTION-PDF-REFERENCE-MODELS"));
  assert.deepEqual(sectionOneQuiz.sourceBundle.sectionIds, ["SECTION-PDF-REFERENCE-MODELS"]);
});

test("B. Section 2 quiz evaluates NETWORK_ENCAPSULATION", () => {
  assert.equal(sectionTwoQuiz.sectionCoverage, "FULL");
  assert.ok(sectionTwoQuiz.questions.length >= 2);
  assert.ok(sectionTwoQuiz.questions.every((question) => question.conceptIds.includes("NETWORK_ENCAPSULATION")));
  assert.ok(sectionTwoQuiz.questions.every((question) => question.pageStart === 20 && question.pageEnd === 20));
});

test("C. Section 2 does not silently reuse Section 1 quiz", () => {
  assert.notEqual(sectionOneQuiz.id, sectionTwoQuiz.id);
  assert.equal(sectionTwoQuiz.questions.some((question) => sectionOneQuiz.questions.some((other) => other.id === question.id)), false);
});

test("D. insufficient coverage is reported honestly", () => {
  assert.equal(coverageFromGroundedQuestions("SECTION-MISSING", []), "INSUFFICIENT");
  assert.equal(coverageFromGroundedQuestions("SECTION-PDF-ENCAPSULATION", sectionTwoQuiz.questions.slice(0, 1)), "PARTIAL");
  assert.equal(coverageFromGroundedQuestions("SECTION-PDF-ENCAPSULATION", sectionTwoQuiz.questions), "FULL");
});

test("E. first error keeps normal feedback", () => {
  let attempt = startAcademicQuiz(createAcademicQuizAttempt(sectionTwoQuiz, 1, "hf1-first"), 2);
  attempt = submitAcademicAnswer(attempt, sectionTwoQuiz, "frame", 3);
  assert.equal(attempt.attempts["encapsulation-transport-unit"], 1);
  assert.equal(attempt.remediations["encapsulation-transport-unit"], undefined);
});

test("F. repeated errors offer remediation through configurable policy", () => {
  const attempt = threeFailures();
  assert.ok(attempt.remediations["encapsulation-transport-unit"]);
  assert.equal(attempt.remediations["encapsulation-transport-unit"].selectedMethod, null);
});

test("G. learner can select a remediation method", () => {
  const selected = selectAcademicRemediation(threeFailures(), sectionTwoQuiz, "ANALOGY", 8);
  assert.equal(selected.remediations["encapsulation-transport-unit"].selectedMethod, "ANALOGY");
});

test("H. recommendation changes with error type", () => {
  assert.notDeepEqual(recommendedRemediation("ORDER_SEQUENCE"), recommendedRemediation("CONCEPT_CONFUSION"));
  assert.equal(recommendedRemediation("SYSTEM_RELATIONSHIP_FAILURE")[0], "MIND_MAP");
});

test("I. remediation cannot promote beyond PRACTICED", () => {
  const completed = {
    ...threeFailures(),
    status: "COMPLETED",
    completedQuestionIds: sectionTwoQuiz.questions.map((question) => question.id),
    completedAt: 20,
  };
  assert.equal(academicQuizOutcome(completed, sectionTwoQuiz).maxState, "PRACTICED");
  assert.equal(sectionTwoQuiz.maxCompetencyState, "PRACTICED");
});

test("J. post-remediation retry closes support and uses retrieval", () => {
  const selected = selectAcademicRemediation(threeFailures(), sectionTwoQuiz, "SIMPLE_EXPLANATION", 8);
  const closed = closeAcademicRemediation(selected, sectionTwoQuiz, 9);
  assert.ok(closed.retrievalQuestionIds.includes("encapsulation-transport-unit"));
  assert.ok(sectionTwoQuiz.questions[0].retrievalPrompt);
  assert.notEqual(sectionTwoQuiz.questions[0].retrievalPrompt, sectionTwoQuiz.questions[0].prompt);
  const recalled = submitAcademicAnswer(closed, sectionTwoQuiz, "segment", 10);
  assert.equal(recalled.remediations["encapsulation-transport-unit"].postRemediationResult, "SUCCESS");
});

test("K. ErrorPattern preserves source, section and remediation method", () => {
  const failedAttempt = threeFailures();
  const initialEvidence = academicEvidenceFromAttempt(failedAttempt, sectionTwoQuiz);
  const initialSignals = academicErrorSignals(failedAttempt, sectionTwoQuiz, initialEvidence.map((item) => item.id));
  const initialPatterns = mergeErrorPatterns([], initialSignals);
  let attempt = selectAcademicRemediation(failedAttempt, sectionTwoQuiz, "MIND_MAP", 8);
  attempt = closeAcademicRemediation(attempt, sectionTwoQuiz, 9);
  attempt = submitAcademicAnswer(attempt, sectionTwoQuiz, "segment", 10);
  const evidence = academicEvidenceFromAttempt(attempt, sectionTwoQuiz);
  const signals = academicErrorSignals(attempt, sectionTwoQuiz, evidence.map((item) => item.id));
  const pattern = mergeErrorPatterns(initialPatterns, signals)[0];
  assert.equal(pattern.concept, "ENCAPSULATION_PDU_CONFUSION");
  assert.equal(pattern.occurrenceCount, initialPatterns[0].occurrenceCount);
  assert.deepEqual(pattern.metadata.academicSectionIds, ["SECTION-PDF-ENCAPSULATION"]);
  assert.deepEqual(pattern.metadata.remediationMethods, ["MIND_MAP"]);
});

test("L. ReviewItem is created with remediation provenance", () => {
  let attempt = selectAcademicRemediation(threeFailures(), sectionTwoQuiz, "SOURCE_REVIEW", 8);
  attempt = closeAcademicRemediation(attempt, sectionTwoQuiz, 9);
  const evidence = academicEvidenceFromAttempt(attempt, sectionTwoQuiz);
  const patterns = mergeErrorPatterns([], academicErrorSignals(attempt, sectionTwoQuiz, evidence.map((item) => item.id)));
  const item = generateReviewItems([], patterns, 10)[0];
  assert.equal(item.concept, "ENCAPSULATION_PDU_CONFUSION");
  assert.deepEqual(item.academicSourceIds, ["ACADEMIC-NETWORK-CH01-001"]);
  assert.deepEqual(item.remediationMethods, ["SOURCE_REVIEW"]);
});

test("M. remediation source provenance remains exact", () => {
  const support = remediationSupport("SOURCE_REVIEW", sectionTwoQuiz.questions[0]);
  assert.equal(support.sourceId, "ACADEMIC-NETWORK-CH01-001");
  assert.equal(support.sectionId, "SECTION-PDF-ENCAPSULATION");
  assert.equal(support.pageStart, 20);
});

test("N. pedagogical analogy is explicitly marked derived", () => {
  const descriptor = remediationMethod("ANALOGY");
  const support = remediationSupport("ANALOGY", sectionTwoQuiz.questions[0]);
  assert.equal(descriptor.generationMethod, "PEDAGOGICAL_DERIVATION");
  assert.match(support.pedagogicalSupport, /Analogie pédagogique/);
  assert.match(support.pedagogicalSupport, /pas une formulation littérale du cours/);
});

test("O. refresh and pause representation preserves remediation state", () => {
  const selected = selectAcademicRemediation(threeFailures(), sectionTwoQuiz, "FLASHCARDS", 8);
  const restored = JSON.parse(JSON.stringify(selected));
  assert.deepEqual(restored.remediations, selected.remediations);
  assert.deepEqual(restored.retrievalQuestionIds, selected.retrievalQuestionIds);
});
