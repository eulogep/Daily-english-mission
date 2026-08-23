"""Bounded, local-only Docling bridge for Engineer Learning OS."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def _within(path: Path, roots: list[Path]) -> bool:
    resolved = path.resolve()
    return any(resolved == root or root in resolved.parents for root in roots)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--page-start", type=int, required=True)
    parser.add_argument("--page-end", type=int, required=True)
    parser.add_argument("--artifacts-path", required=True)
    parser.add_argument("--allowed-root", action="append", required=True)
    parser.add_argument("--timeout", type=float, default=600.0)
    parser.add_argument("--detect-formulas", action="store_true")
    args = parser.parse_args()

    source = Path(args.input).resolve()
    roots = [Path(value).resolve() for value in args.allowed_root]
    artifacts = Path(args.artifacts_path).resolve()
    if not source.is_file() or not _within(source, roots):
        raise ValueError("Input document is outside the approved local roots")
    if source.suffix.lower() != ".pdf":
        raise ValueError("This bridge accepts PDF input only")
    if args.page_start < 1 or args.page_end < args.page_start:
        raise ValueError("Invalid bounded page range")
    if not artifacts.is_dir():
        raise ValueError("Local Docling artifacts are unavailable")

    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["DOCLING_SERVE_ENABLE_REMOTE_SERVICES"] = "false"

    from docling.datamodel.accelerator_options import AcceleratorDevice, AcceleratorOptions
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.document_converter import DocumentConverter, PdfFormatOption

    options = PdfPipelineOptions(
        artifacts_path=artifacts,
        accelerator_options=AcceleratorOptions(device=AcceleratorDevice.CPU, num_threads=4),
        document_timeout=args.timeout,
        enable_remote_services=False,
        allow_external_plugins=False,
        do_ocr=False,
        do_table_structure=True,
        do_formula_enrichment=args.detect_formulas,
        do_picture_classification=False,
        do_picture_description=False,
    )
    converter = DocumentConverter(
        allowed_formats=[InputFormat.PDF],
        format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)},
    )
    result = converter.convert(
        source,
        raises_on_error=True,
        page_range=(args.page_start, args.page_end),
    )
    payload = {
        "sourceId": args.source_id,
        "extractorId": "DOCLING",
        "extractorVersion": "2.121.0",
        "localOnly": True,
        "pageRange": [args.page_start, args.page_end],
        "document": result.document.export_to_dict(),
    }
    json.dump(payload, sys.stdout, ensure_ascii=False, separators=(",", ":"))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"DOCLING_EXTRACTION_FAILED: {type(error).__name__}: {error}", file=sys.stderr)
        raise SystemExit(2)
