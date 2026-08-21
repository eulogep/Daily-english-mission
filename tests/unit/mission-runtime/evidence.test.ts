/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { MAX_EVIDENCE_BYTES, validateEvidenceFile } = require("../../../src/modules/mission-runtime/evidence.ts");

test("evidence validation accepts local screenshots and XLSX", () => {
  assert.equal(validateEvidenceFile({ type: "image/png", size: 1024 }), null);
  assert.equal(validateEvidenceFile({ type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 2048 }), null);
});

test("evidence validation blocks unsupported, empty and oversized files", () => {
  assert.match(validateEvidenceFile({ type: "text/plain", size: 10 }), /PNG/);
  assert.match(validateEvidenceFile({ type: "image/png", size: 0 }), /vide/);
  assert.match(validateEvidenceFile({ type: "image/png", size: MAX_EVIDENCE_BYTES + 1 }), /5 Mo/);
});
