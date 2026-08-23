import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { FileDocumentExtractionCache } from "../../../src/modules/document-extraction/cache.ts";
import { routeDocumentExtraction } from "../../../src/modules/document-extraction/core.ts";
import { DoclingDocumentExtractor, normalizeDoclingPayload } from "../../../src/modules/document-extraction/docling-adapter.ts";
import { pathIsWithinRoots, runBoundedLocalProcess } from "../../../src/modules/document-extraction/local-process.ts";
import { PdfJsDocumentExtractor } from "../../../src/modules/document-extraction/pdfjs-adapter.ts";
import { academicPdfQuizIsGrounded } from "../../../src/modules/academic-workspace/core.ts";
import { networkingPdfQuiz } from "../../../src/modules/academic-workspace/pilot-registry.ts";
import { remediationMethod, remediationSupport } from "../../../src/modules/academic-workspace/remediation.ts";

const options = { sourceId: "SYNTHETIC-SOURCE", pageStart: 1, pageEnd: 1, timeoutMs: 1000 };
const payload = {
  sourceId: "SYNTHETIC-SOURCE", extractorVersion: "2.121.0",
  document: {
    pages: { "1": { size: { width: 800, height: 600 } } },
    texts: [{ self_ref: "#/texts/0", label: "section_header", text: "Synthetic heading", prov: [{ page_no: 1, bbox: { l: 10, t: 20, r: 200, b: 40 } }] }],
    pictures: [{ self_ref: "#/pictures/0", label: "picture", prov: [{ page_no: 1, bbox: { l: 10, t: 50, r: 400, b: 500 } }] }],
    tables: [], form_items: [],
  },
};
const normalized = () => normalizeDoclingPayload(payload, options);
const adapterConfig = (runner) => ({ cwd: process.cwd(), pythonPath: "python", bridgePath: "scripts/document-extraction/docling_extract.py", artifactsPath: ".document-cache/models", allowedRoots: [process.cwd()], runner });

test("A. Docling adapter satisfies the replaceable contract", () => {
  const adapter = new DoclingDocumentExtractor(adapterConfig(async () => ({ stdout: JSON.stringify(payload), stderr: "", durationMs: 1 })));
  assert.equal(adapter.id, "DOCLING");
  assert.equal(adapter.localOnly, true);
  assert.ok(adapter.supportedFormats.includes("PDF"));
  assert.equal(typeof adapter.extract, "function");
});
test("B. failed Docling processes surface a recoverable explicit failure", async () => {
  const adapter = new DoclingDocumentExtractor(adapterConfig(async () => { throw new Error("LOCAL_PROCESS_EXIT_2"); }));
  await assert.rejects(() => adapter.extract(path.join(process.cwd(), "synthetic.pdf"), options), /LOCAL_PROCESS_EXIT_2/);
});
test("C. bounded local process enforces its timeout", async () => {
  await assert.rejects(() => runBoundedLocalProcess(process.execPath, ["-e", "setTimeout(() => {}, 1000)"], { cwd: process.cwd(), timeoutMs: 25, maxOutputBytes: 1024 }), /LOCAL_PROCESS_TIMEOUT/);
});
test("D. Docling output is converted to the owned normalized model", () => {
  const result = normalized();
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.extractorId, "DOCLING");
  assert.equal(result.pages[0].blocks[0].kind, "HEADING");
});
test("E. normalized blocks preserve one-based page provenance", () => assert.equal(normalized().pages[0].blocks[0].provenance.pageNumber, 1));
test("F. unverified diagrams produce a separate partial visual status", () => assert.equal(normalized().pages[0].visualStatus, "PARTIAL"));
test("G. overall extraction quality is not silently high when visual semantics are unverified", () => assert.equal(normalized().quality, "MEDIUM"));
test("H. router selects pdfjs-dist for a simple reliable text PDF", () => assert.equal(routeDocumentExtraction({ format: "PDF", pdfType: "TEXT_PDF", textLayerReliable: true, doclingAvailable: true }).extractorId, "PDFJS"));
test("I. router selects Docling for a complex layout", () => assert.equal(routeDocumentExtraction({ format: "PDF", pdfType: "TEXT_PDF", complexLayout: true, doclingAvailable: true }).extractorId, "DOCLING"));
test("J. scanned PDFs remain on an explicit OCR_REQUIRED path", () => {
  const route = routeDocumentExtraction({ format: "PDF", pdfType: "SCANNED_PDF", textLayerReliable: false, doclingAvailable: true });
  assert.equal(route.extractorId, null);
  assert.match(route.reasons.join(" "), /OCR_REQUIRED/);
});
test("K. a stored normalized document produces a cache hit", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "elos-doc-cache-"));
  try {
    const cache = new FileDocumentExtractionCache(directory);
    const identity = { sourceChecksum: "abc", extractorId: "DOCLING" as const, extractorVersion: "2.121.0", options, schemaVersion: 1 as const };
    await cache.set(identity, normalized());
    const hit = await cache.get(identity);
    assert.ok(hit);
    assert.equal(hit.sourceId, "SYNTHETIC-SOURCE");
    assert.equal(hit.extractorVersion, "2.121.0");
    assert.equal(hit.pages.length, 1);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test("L. changing extractor version invalidates the cache", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "elos-doc-cache-"));
  try {
    const cache = new FileDocumentExtractionCache(directory);
    const identity = { sourceChecksum: "abc", extractorId: "DOCLING" as const, extractorVersion: "2.121.0", options, schemaVersion: 1 as const };
    await cache.set(identity, normalized());
    assert.equal(await cache.get({ ...identity, extractorVersion: "next" }), null);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
test("M. safe-path guard accepts descendants and rejects siblings", () => {
  const root = path.join(process.cwd(), "synthetic-root");
  assert.equal(pathIsWithinRoots(path.join(root, "fixture.pdf"), [root]), true);
  assert.equal(pathIsWithinRoots(path.join(process.cwd(), "elsewhere", "fixture.pdf"), [root]), false);
});
test("N. extraction bridge is offline and remote services are disabled", () => {
  const files = ["scripts/document-extraction/docling_extract.py", "src/modules/document-extraction/local-process.ts", "src/modules/document-extraction/docling-adapter.ts"];
  const source = files.map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8")).join("\n");
  assert.match(source, /HF_HUB_OFFLINE/);
  assert.match(source, /enable_remote_services=False/);
  assert.doesNotMatch(source, /fetch\(|axios|https?:\/\//i);
});
test("O. vendor-specific objects do not leak into the normalized domain", () => {
  const result = JSON.stringify(normalized());
  assert.doesNotMatch(result, /self_ref|schema_name|#\/texts|#\/pictures/);
});
test("P. current pdfjs-dist behavior and lightweight adapter remain available", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  const adapter = new PdfJsDocumentExtractor();
  assert.match(packageJson.dependencies["pdfjs-dist"], /6\.2\.108/);
  assert.equal(adapter.id, "PDFJS");
});
test("Q. existing PDF quiz provenance remains grounded", () => assert.equal(academicPdfQuizIsGrounded(networkingPdfQuiz), true));
test("R. existing source-grounded remediation remains available", () => {
  const support = remediationSupport("ANALOGY", networkingPdfQuiz.questions[0]);
  assert.equal(support.sourceId, networkingPdfQuiz.questions[0].sourceId);
  assert.equal(support.pedagogicalSupportKind, "ANALOGY");
  assert.equal(remediationMethod("ANALOGY").evidencePolicy, "GUIDED_PRACTICE_ONLY");
});
