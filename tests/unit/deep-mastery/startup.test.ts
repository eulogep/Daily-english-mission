/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type { DeepMasteryAttempt } from "../../../src/modules/deep-mastery/types.ts";
const assert = require("node:assert/strict");
const test = require("node:test");
const { csvDelimiterMastery } = require("../../../src/modules/deep-mastery/csv-delimiter-definition.ts");
const { createDeepMasteryAttempt, startDeepMasteryAttempt, submitDeepMasteryStep, continueDeepMasteryAttempt } = require("../../../src/modules/deep-mastery/core.ts");
const { bootstrapDeepMastery, validateDeepMasteryAttempt } = require("../../../src/modules/deep-mastery/startup.ts");

function harness(saved?: unknown) {
  let attempt = saved;
  let prepareCount = 0;
  let recoverCount = 0;
  let readyCount = 0;
  let errorCount = 0;
  return {
    dependencies: {
      definition: csvDelimiterMastery,
      hydrate: async (): Promise<void> => undefined,
      readAttempt: () => attempt,
      prepareFresh: () => { prepareCount += 1; attempt = createDeepMasteryAttempt(csvDelimiterMastery, 10, "fresh-session"); },
      recoverMalformed: () => { recoverCount += 1; attempt = createDeepMasteryAttempt(csvDelimiterMastery, 11, "recovered-session"); },
      markReady: () => { readyCount += 1; },
      markRecoverableError: () => { errorCount += 1; },
      timeoutMs: 25,
    },
    read: () => ({ attempt, prepareCount, recoverCount, readyCount, errorCount }),
  };
}

test("bootstrap reaches READY through the bounded startup contract", async () => {
  const setup = harness();
  assert.equal(await bootstrapDeepMastery(setup.dependencies), "READY");
  assert.equal(setup.read().readyCount, 1);
  assert.equal(setup.read().errorCount, 0);
});

test("fresh metadata creates exactly one valid session", async () => {
  const setup = harness();
  await bootstrapDeepMastery(setup.dependencies);
  const state = setup.read();
  assert.equal(state.prepareCount, 1);
  assert.equal(validateDeepMasteryAttempt(state.attempt, csvDelimiterMastery), true);
});

test("an existing valid session restores exact progress", async () => {
  let restored: DeepMasteryAttempt = startDeepMasteryAttempt(createDeepMasteryAttempt(csvDelimiterMastery, 1, "restored"), 2);
  restored = continueDeepMasteryAttempt(submitDeepMasteryStep(restored, csvDelimiterMastery, "acknowledged", 5, 3), csvDelimiterMastery, 4);
  const setup = harness(restored);
  assert.equal(await bootstrapDeepMastery(setup.dependencies), "READY");
  assert.equal((setup.read().attempt as DeepMasteryAttempt).currentStepIndex, 1);
  assert.equal(setup.read().prepareCount, 0);
});

test("malformed persisted session is replaced only inside Deep Mastery", async () => {
  const setup = harness({ id: "stale", status: "LOADING", currentStepIndex: 999 });
  assert.equal(await bootstrapDeepMastery(setup.dependencies), "RECOVERED");
  assert.equal(setup.read().recoverCount, 1);
  assert.equal((setup.read().attempt as DeepMasteryAttempt).id, "recovered-session");
});

test("an unresolved hydration transitions to RECOVERABLE_ERROR after timeout", async () => {
  const setup = harness();
  setup.dependencies.hydrate = () => new Promise<void>(() => undefined);
  assert.equal(await bootstrapDeepMastery(setup.dependencies), "RECOVERABLE_ERROR");
  assert.equal(setup.read().errorCount, 1);
});

test("retry succeeds after a transient hydration timeout", async () => {
  const setup = harness();
  setup.dependencies.hydrate = () => new Promise<void>(() => undefined);
  assert.equal(await bootstrapDeepMastery(setup.dependencies), "RECOVERABLE_ERROR");
  setup.dependencies.hydrate = async () => undefined;
  assert.equal(await bootstrapDeepMastery(setup.dependencies), "READY");
  assert.equal(setup.read().readyCount, 1);
});

test("StrictMode-style double initialization is idempotent", async () => {
  const setup = harness();
  await Promise.all([bootstrapDeepMastery(setup.dependencies), bootstrapDeepMastery(setup.dependencies)]);
  const state = setup.read();
  assert.equal(state.prepareCount, 1);
  assert.equal((state.attempt as DeepMasteryAttempt).id, "fresh-session");
  assert.equal(validateDeepMasteryAttempt(state.attempt, csvDelimiterMastery), true);
});
