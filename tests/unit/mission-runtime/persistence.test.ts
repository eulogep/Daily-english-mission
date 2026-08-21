/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const { excelLevel1Mission } = require("../../../src/modules/mission-runtime/excel-level-1-mission.ts");
const {
  activateMissionActivity,
  createMissionAttempt,
  MAX_PLAUSIBLE_LEGACY_ACTIVE_MS,
  pauseMissionAttempt,
  resumeMissionAttempt,
  sanitizeHydratedMissionAttempt,
  suspendMissionActivity,
} = require("../../../src/modules/mission-runtime/attempt-state.ts");

test("pause and resume preserve the exact step, answers and elapsed time", () => {
  const base = createMissionAttempt(excelLevel1Mission, 1_000);
  const active = {
    ...base,
    status: "IN_PROGRESS",
    currentStepIndex: 4,
    responses: { "check-columns": "separate-columns" },
    activeSince: 2_000,
    elapsedMs: 500,
  };
  const paused = pauseMissionAttempt(active, 3_500);
  assert.equal(paused.status, "PAUSED");
  assert.equal(paused.currentStepIndex, 4);
  assert.deepEqual(paused.responses, active.responses);
  assert.equal(paused.elapsedMs, 2_000);
  assert.equal(paused.activeSince, null);

  const resumed = resumeMissionAttempt(paused, 5_000);
  assert.equal(resumed.status, "IN_PROGRESS");
  assert.equal(resumed.currentStepIndex, 4);
  assert.equal(resumed.elapsedMs, 2_000);
  assert.equal(resumed.activeSince, 5_000);
  assert.equal(resumed.events.at(-1).type, "MISSION_RESUMED");
});

test("background and closed-tab gaps are excluded from active time", () => {
  const base = createMissionAttempt(excelLevel1Mission, 1_000);
  const firstVisibleInterval = { ...base, status: "IN_PROGRESS", activeSince: 2_000, elapsedMs: 500 };
  const hidden = suspendMissionActivity(firstVisibleInterval, 3_500);
  assert.equal(hidden.elapsedMs, 2_000);
  assert.equal(hidden.activeSince, null);

  const visibleAgain = activateMissionActivity(hidden, 20_000);
  const hiddenAgain = suspendMissionActivity(visibleAgain, 22_000);
  assert.equal(hiddenAgain.elapsedMs, 4_000);
  assert.equal(hiddenAgain.activeSince, null);
});

test("rehydration closes stale intervals without counting downtime", () => {
  const base = createMissionAttempt(excelLevel1Mission, 1_000);
  const persisted = { ...base, status: "IN_PROGRESS", activeSince: 2_000, elapsedMs: 3_000 };
  const hydrated = sanitizeHydratedMissionAttempt(persisted);
  assert.equal(hydrated.elapsedMs, 3_000);
  assert.equal(hydrated.activeSince, null);
  assert.equal(hydrated.timingReliable, true);
});

test("manifestly corrupted legacy completion time is marked unavailable", () => {
  const legacy = { ...createMissionAttempt(excelLevel1Mission), status: "COMPLETED", elapsedMs: MAX_PLAUSIBLE_LEGACY_ACTIVE_MS + 1 };
  delete legacy.timingReliable;
  const hydrated = sanitizeHydratedMissionAttempt(legacy);
  assert.equal(hydrated.timingReliable, false);
});
