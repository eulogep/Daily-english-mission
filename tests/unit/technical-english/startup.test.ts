/* eslint-disable @typescript-eslint/no-require-imports -- Node strip-types test runner */
import type {} from "node:test";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  TechnicalEnglishHydrationError,
  hydrateWithWatchdog,
  hydrationErrorMessage,
  invokeTechnicalEnglishBootstrap,
  validateHydratedTechnicalEnglishState,
} = require("../../../src/modules/technical-english/startup.ts");
const { createTechnicalEnglishAttempt } = require("../../../src/modules/technical-english/core.ts");

test("scenario A: fresh persistence initialization resolves promptly", async () => {
  const startedAt = performance.now();
  await hydrateWithWatchdog(() => Promise.resolve(), 100);
  assert.ok(performance.now() - startedAt < 100);
});

test("scenario B: valid existing attempt metadata passes startup validation independently of other learner stores", () => {
  const attempt = createTechnicalEnglishAttempt(1_000, "existing-audio-attempt");
  attempt.audioReference = {
    id: "local-audio-reference",
    displayName: "response.webm",
    mimeType: "audio/webm",
    size: 100,
    storedAt: 1_100,
    durationMs: 30_000,
    verificationStatus: "UNVERIFIED",
  };
  assert.doesNotThrow(() => validateHydratedTechnicalEnglishState({ [attempt.id]: attempt }, attempt.id));
});

test("scenario C: existing audio binary is loaded only inside the replay action", () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), "src/components/technical-english/AudioResponse.tsx"), "utf8");
  const replayStart = source.indexOf("async function replay()");
  const binaryLoad = source.indexOf("loadAudioUrl(existing)");
  assert.ok(replayStart > 0);
  assert.ok(binaryLoad > replayStart);
  assert.doesNotMatch(source.slice(0, replayStart), /loadAudioUrl\(existing\)/);
});

test("scenario D: repeated successful hydration calls do not accumulate state or hang", async () => {
  let calls = 0;
  const rehydrate = async () => { calls += 1; };
  await hydrateWithWatchdog(rehydrate, 100);
  await hydrateWithWatchdog(rehydrate, 100);
  assert.equal(calls, 2);
});

test("scenario E: an unresolved storage read becomes a bounded recoverable timeout", async () => {
  await assert.rejects(
    hydrateWithWatchdog(() => new Promise<void>(() => undefined), 15),
    (error: unknown) => error instanceof TechnicalEnglishHydrationError && (error as { code?: string }).code === "TIMEOUT",
  );
});

test("scenario F: malformed localStorage is reported without mutating the stored value and retry remains possible", async () => {
  const storageValues = new Map([["engineer-learning-os:technical-english:v1", "{malformed-json"]]);
  await assert.rejects(
    hydrateWithWatchdog(() => Promise.reject(new SyntaxError("invalid JSON")), 100),
    (error: unknown) => error instanceof TechnicalEnglishHydrationError && (error as { code?: string }).code === "STORAGE_ERROR",
  );
  assert.equal(storageValues.get("engineer-learning-os:technical-english:v1"), "{malformed-json");
  await assert.doesNotReject(hydrateWithWatchdog(() => Promise.resolve(), 100));
});

test("startup status is held outside the persisted learner store", () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), "src/modules/technical-english/browser-store.ts"), "utf8");
  const persistedState = source.slice(source.indexOf("export const useTechnicalEnglishStore"), source.indexOf("type TechnicalEnglishStartupState"));
  const startupState = source.slice(source.indexOf("type TechnicalEnglishStartupState"));
  assert.doesNotMatch(persistedState, /hydrationStatus|hydrationError|markHydrationFailed/);
  assert.match(startupState, /useTechnicalEnglishStartupStore/);
});

test("storage rejection produces a learner-safe message without exposing internal errors", async () => {
  let caught: unknown;
  try {
    await hydrateWithWatchdog(() => Promise.reject(new Error("sensitive storage detail")), 100);
  } catch (error) {
    caught = error;
  }
  assert.equal((caught as { code?: string }).code, "STORAGE_ERROR");
  assert.doesNotMatch(hydrationErrorMessage(caught), /sensitive/);
});

test("invalid but parseable attempt state is rejected rather than silently reset", () => {
  assert.throws(
    () => validateHydratedTechnicalEnglishState({ broken: { id: "broken" } }, "broken"),
    (error: unknown) => error instanceof TechnicalEnglishHydrationError && (error as { code?: string }).code === "INVALID_STATE",
  );
});

test("route client entrypoint invokes bootstrap on fresh mount, remount and StrictMode-style double mount", async () => {
  let calls = 0;
  const initialize = async () => { calls += 1; };
  await invokeTechnicalEnglishBootstrap(initialize);
  await invokeTechnicalEnglishBootstrap(initialize);
  await invokeTechnicalEnglishBootstrap(initialize);
  assert.equal(calls, 3);
});

test("route owns the single bootstrap effect and secondary components cannot suppress it", () => {
  const route = fs.readFileSync(path.resolve(process.cwd(), "src/app/learn/technical-english/page.tsx"), "utf8");
  const entrypoint = fs.readFileSync(path.resolve(process.cwd(), "src/components/technical-english/TechnicalEnglishBootstrap.tsx"), "utf8");
  const errorBoundary = fs.readFileSync(path.resolve(process.cwd(), "src/app/learn/technical-english/error.tsx"), "utf8");
  const workspace = fs.readFileSync(path.resolve(process.cwd(), "src/components/technical-english/TechnicalEnglishWorkspace.tsx"), "utf8");
  const bridge = fs.readFileSync(path.resolve(process.cwd(), "src/components/technical-english/TechnicalEnglishRecordBridge.tsx"), "utf8");
  assert.match(route, /<TechnicalEnglishBootstrap>/);
  assert.doesNotMatch(route, /ClientProbe|BootTrace/);
  assert.match(entrypoint, /^"use client";/);
  assert.match(entrypoint, /useEffect\(\(\) => \{/);
  assert.match(entrypoint, /invokeTechnicalEnglishBootstrap\(initializeTechnicalEnglishStore\)/);
  assert.doesNotMatch(entrypoint, /diagnostic|CLIENT_COMPONENT|BootTrace/);
  assert.match(errorBoundary, /Le module Technical English n&apos;a pas pu démarrer/);
  assert.doesNotMatch(workspace, /useEffect/);
  assert.doesNotMatch(bridge, /void initializeTechnicalEnglishStore/);
});

test("temporary hydration probes and debug routes are removed after human validation", () => {
  const layout = fs.readFileSync(path.resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
  const appShell = fs.readFileSync(path.resolve(process.cwd(), "src/components/app-shell/AppShell.tsx"), "utf8");
  assert.doesNotMatch(layout, /GlobalClientProbe/);
  assert.doesNotMatch(appShell, /APP_SHELL_CLIENT|diagnosticsEnabled|REACT_DIAGNOSTICS/);
  assert.equal(fs.existsSync(path.resolve(process.cwd(), "src/components/debug/GlobalClientProbe.tsx")), false);
  assert.equal(fs.existsSync(path.resolve(process.cwd(), "src/app/debug/react-client/page.tsx")), false);
  assert.equal(fs.existsSync(path.resolve(process.cwd(), "src/pages/debug/raw-client.tsx")), false);
});
