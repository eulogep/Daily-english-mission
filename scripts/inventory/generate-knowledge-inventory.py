"""Generate a non-destructive metadata inventory of the local academic corpus."""

from __future__ import annotations

import csv
import hashlib
import os
import re
import stat
import sys
import unicodedata
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path, PureWindowsPath
from typing import Callable, Iterable


FIELDNAMES = [
    "path",
    "file_name",
    "extension",
    "size",
    "academic_year",
    "suspected_subject",
    "suspected_document_type",
    "modified_date",
    "language",
    "alternance_relevance",
    "professional_domain",
    "possible_duplicate",
    "checksum",
    "status",
    "notes",
]

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = REPOSITORY_ROOT / "cours esiea"
DEFAULT_OUTPUT = REPOSITORY_ROOT / "knowledge-inventory.csv"

CODE_EXTENSIONS = {
    "c", "cc", "cpp", "cs", "css", "go", "h", "hpp", "html", "java",
    "js", "jsx", "kt", "kts", "php", "ps1", "py", "rb", "rs", "sh",
    "sql", "swift", "ts", "tsx", "vue", "xml", "yaml", "yml",
}
DATASET_EXTENSIONS = {"csv", "feather", "jsonl", "parquet", "tsv", "xls", "xlsm", "xlsx"}
PRESENTATION_EXTENSIONS = {"key", "odp", "ppt", "pptx"}


@dataclass
class ScanStats:
    hidden_skipped: int = 0
    reparse_points_skipped: int = 0
    scan_errors: int = 0


def normalized_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_text = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", ascii_text.casefold()).strip()


def contains_term(text: str, term: str) -> bool:
    return re.search(rf"(?:^| )({re.escape(term)})(?: |$)", text) is not None


def is_hidden(entry: os.DirEntry[str], entry_stat: os.stat_result) -> bool:
    hidden_attribute = getattr(stat, "FILE_ATTRIBUTE_HIDDEN", 0)
    attributes = getattr(entry_stat, "st_file_attributes", 0)
    return entry.name.startswith(".") or bool(hidden_attribute and attributes & hidden_attribute)


def is_reparse_point(entry: os.DirEntry[str], entry_stat: os.stat_result) -> bool:
    reparse_attribute = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0)
    attributes = getattr(entry_stat, "st_file_attributes", 0)
    is_junction = getattr(os.path, "isjunction", lambda _path: False)
    return entry.is_symlink() or bool(reparse_attribute and attributes & reparse_attribute) or is_junction(entry.path)


def relative_inventory_path(path: Path, source_root: Path) -> str:
    root = source_root.resolve(strict=True)
    resolved = path.resolve(strict=True)
    if not resolved.is_relative_to(root):
        raise ValueError("Path outside authorized source root")
    return resolved.relative_to(root).as_posix()


def iter_source_files(source_root: Path, stats: ScanStats) -> Iterable[Path]:
    root = source_root.resolve(strict=True)
    pending = [root]
    while pending:
        directory = pending.pop()
        try:
            entries = sorted(os.scandir(directory), key=lambda item: item.name.casefold())
        except OSError as error:
            stats.scan_errors += 1
            relative = "." if directory == root else directory.relative_to(root).as_posix()
            print(f"SCAN_ERROR {relative}: {type(error).__name__}", file=sys.stderr)
            continue

        child_directories: list[Path] = []
        for entry in entries:
            try:
                entry_stat = entry.stat(follow_symlinks=False)
                if is_hidden(entry, entry_stat):
                    stats.hidden_skipped += 1
                    continue
                if is_reparse_point(entry, entry_stat):
                    stats.reparse_points_skipped += 1
                    continue
                candidate = Path(entry.path)
                if entry.is_dir(follow_symlinks=False):
                    child_directories.append(candidate)
                elif entry.is_file(follow_symlinks=False):
                    try:
                        relative_inventory_path(candidate, root)
                    except (OSError, ValueError) as error:
                        stats.scan_errors += 1
                        print(f"SCAN_ERROR {entry.name}: {type(error).__name__}", file=sys.stderr)
                        continue
                    yield candidate
            except OSError as error:
                stats.scan_errors += 1
                print(f"SCAN_ERROR {entry.name}: {type(error).__name__}", file=sys.stderr)
        pending.extend(reversed(child_directories))


def infer_academic_year(relative_path: str) -> str:
    text = normalized_text(relative_path)
    year_match = re.search(r"\b(20\d{2})[ -](20\d{2})\b", text)
    if year_match:
        return f"{year_match.group(1)}-{year_match.group(2)}"
    compact_year_match = re.search(r"\b(20\d{2})(20\d{2})\b", text)
    if compact_year_match:
        return f"{compact_year_match.group(1)}-{compact_year_match.group(2)}"
    level_match = re.search(r"\b([123])\s*a\b", text)
    if level_match:
        return f"{level_match.group(1)}A"
    return "UNKNOWN"


def infer_subject(relative_path: str) -> str:
    text = normalized_text(relative_path)
    mappings = [
        ("GESTION_PROJET", ("gestion de projet", "project management", "management de projet")),
        ("CYBERSECURITE", ("cybersecurite", "cybersecurity", "securite informatique", "security")),
        ("PROBABILITES", ("probabilite", "probabilites", "probability", "statistics", "statistique")),
        ("MATHEMATIQUES", ("mathematique", "mathematiques", "maths", "algebre", "analyse numerique")),
        ("DATABASE", ("base de donnees", "bases de donnees", "database", "bdd", "sql")),
        ("SYSTEME", ("systeme", "systemes", "linux", "unix", "windows server", "active directory")),
        ("RESEAU", ("reseau", "reseaux", "network", "routage", "routing", "tcp ip")),
        ("ANGLAIS", ("anglais", "english", "business english")),
        ("PYTHON", ("python",)),
        ("JAVA", ("java",)),
        ("WEB", ("developpement web", "web", "html", "css", "javascript")),
    ]
    for value, terms in mappings:
        if any(contains_term(text, term) for term in terms):
            return value
    return "UNKNOWN"


def infer_document_type(relative_path: str, extension: str) -> str:
    text = normalized_text(relative_path)
    explicit_mappings = [
        ("CORRECTION", ("corrige", "corriges", "correction", "corrections", "solution", "solutions", "answer key")),
        ("EXAM", ("examen", "exam", "annale", "annales", "partiel", "rattrapage")),
        ("PROJECT", ("projet", "project")),
        ("REPORT", ("rapport", "report", "compte rendu")),
        ("PRESENTATION", ("presentation", "slides", "diaporama")),
        ("EXERCISE", ("exercice", "exercices", "exercise", "exercises")),
        ("TD", ("td", "travaux diriges")),
        ("TP", ("tp", "travaux pratiques", "lab")),
        ("COURSE", ("cours", "course", "lecture")),
        ("REFERENCE", ("reference", "documentation", "manuel", "manual")),
    ]
    for value, terms in explicit_mappings:
        if any(contains_term(text, term) for term in terms):
            return value
    if extension in PRESENTATION_EXTENSIONS:
        return "PRESENTATION"
    if extension in CODE_EXTENSIONS:
        return "CODE"
    if extension in DATASET_EXTENSIONS:
        return "DATASET"
    return "UNKNOWN"


def infer_language(relative_path: str) -> str:
    text = normalized_text(relative_path)
    english = any(contains_term(text, term) for term in ("anglais", "english", "business english"))
    french = any(contains_term(text, term) for term in ("francais", "french"))
    if english and french:
        return "MIXED"
    if english:
        return "EN"
    if french:
        return "FR"
    return "UNKNOWN"


def infer_professional_domain(relative_path: str) -> str:
    text = normalized_text(relative_path)
    mappings = [
        ("POWER_BI", ("power bi", "powerbi", "dax", "power query")),
        ("SQL", ("sql",)),
        ("EXCEL", ("excel", "xlsx", "xlsm")),
        ("MALTING", ("maltage", "malting", "malt")),
        ("COMPANY", ("soufflet", "invivo")),
        ("UAT", ("uat", "recette", "test fonctionnel", "tests fonctionnels")),
        ("CHANGE_MANAGEMENT", ("conduite du changement", "change management")),
        ("GOVERNANCE", ("gouvernance", "governance", "copil", "comite de pilotage", "raid log")),
        ("DEPLOYMENT", ("deploiement", "deployment", "rollout")),
        ("BUSINESS_ENGLISH", ("anglais professionnel", "business english")),
        ("PROJECT_MANAGEMENT", ("gestion de projet", "project management")),
        ("CYBERSECURITY", ("cybersecurite", "cybersecurity", "securite informatique")),
        ("NETWORK", ("reseau", "reseaux", "network", "routage", "routing")),
        ("SYSTEM", ("systeme", "systemes", "linux", "unix", "windows server", "active directory")),
        ("DATABASE", ("base de donnees", "bases de donnees", "database", "bdd")),
        ("AI", ("intelligence artificielle", "artificial intelligence", "machine learning", "ia")),
        ("PROGRAMMING", ("programmation", "programming", "python", "java", "developpement web")),
        ("DATA", ("data", "donnees", "analyse de donnees", "visualisation", "reporting", "kpi")),
    ]
    for value, terms in mappings:
        if any(contains_term(text, term) for term in terms):
            return value
    return "UNKNOWN"


def infer_alternance_relevance(subject: str, domain: str) -> str:
    if domain in {
        "POWER_BI", "SQL", "EXCEL", "DATA", "DATABASE", "UAT", "CHANGE_MANAGEMENT",
        "GOVERNANCE", "BUSINESS_ENGLISH", "PROJECT_MANAGEMENT", "MALTING", "AI", "DEPLOYMENT",
    }:
        return "HIGH"
    if domain in {"NETWORK", "SYSTEM", "CYBERSECURITY", "PROGRAMMING"}:
        return "MEDIUM"
    if subject in {"MATHEMATIQUES", "PROBABILITES"}:
        return "LOW"
    return "UNKNOWN"


def hash_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_inventory_row(
    path: Path,
    source_root: Path,
    hasher: Callable[[Path], str] = hash_file,
) -> dict[str, str | int]:
    relative_path = relative_inventory_path(path, source_root)
    extension = path.suffix.casefold().lstrip(".")
    subject = infer_subject(relative_path)
    document_type = infer_document_type(relative_path, extension)
    language = infer_language(relative_path)
    domain = infer_professional_domain(relative_path)
    relevance = infer_alternance_relevance(subject, domain)
    notes: list[str] = []
    status = "INVENTORIED"
    checksum = ""
    size = 0
    modified_date = ""

    try:
        file_stat = path.stat()
        size = file_stat.st_size
        modified_date = datetime.fromtimestamp(file_stat.st_mtime).isoformat(timespec="seconds")
        if size == 0:
            notes.append("Empty file")
        checksum = hasher(path)
    except PermissionError:
        status = "READ_ERROR"
        notes.append("Unreadable file")
    except OSError:
        status = "CHECKSUM_ERROR"
        notes.append("Checksum error")

    if subject == "UNKNOWN" or document_type == "UNKNOWN":
        notes.append("Classification uncertain")

    return {
        "path": relative_path,
        "file_name": path.name,
        "extension": extension,
        "size": size,
        "academic_year": infer_academic_year(relative_path),
        "suspected_subject": subject,
        "suspected_document_type": document_type,
        "modified_date": modified_date,
        "language": language,
        "alternance_relevance": relevance,
        "professional_domain": domain,
        "possible_duplicate": "NO",
        "checksum": checksum,
        "status": status,
        "notes": "; ".join(notes),
    }


def mark_possible_duplicates(rows: list[dict[str, str | int]]) -> None:
    counts = Counter(str(row["checksum"]) for row in rows if row["checksum"])
    for row in rows:
        checksum = str(row["checksum"])
        if checksum and counts[checksum] > 1:
            row["possible_duplicate"] = "YES"
            notes = str(row["notes"])
            row["notes"] = f"{notes}; Duplicate checksum" if notes else "Duplicate checksum"


def write_inventory(rows: list[dict[str, str | int]], output_path: Path) -> None:
    temporary_output = output_path.with_suffix(output_path.suffix + ".tmp")
    try:
        with temporary_output.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDNAMES, lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)
        os.replace(temporary_output, output_path)
    finally:
        temporary_output.unlink(missing_ok=True)


def path_looks_absolute(value: str) -> bool:
    return Path(value).is_absolute() or PureWindowsPath(value).is_absolute() or value.startswith(("/", "\\"))


def summarize(rows: list[dict[str, str | int]], stats: ScanStats) -> dict[str, int]:
    checksums = {str(row["checksum"]) for row in rows if row["checksum"]}
    return {
        "files_scanned": len(rows),
        "inventory_rows": len(rows),
        "total_size": sum(int(row["size"]) for row in rows),
        "unique_checksums": len(checksums),
        "possible_duplicates": sum(row["possible_duplicate"] == "YES" for row in rows),
        "read_errors": sum(row["status"] == "READ_ERROR" for row in rows),
        "checksum_errors": sum(row["status"] == "CHECKSUM_ERROR" for row in rows),
        "unsupported_files": sum(row["status"] == "UNSUPPORTED" for row in rows),
        "absolute_paths_detected": sum(path_looks_absolute(str(row["path"])) for row in rows),
        "outside_paths_detected": sum(".." in Path(str(row["path"])).parts for row in rows),
        "hidden_skipped": stats.hidden_skipped,
        "reparse_points_skipped": stats.reparse_points_skipped,
        "scan_errors": stats.scan_errors,
        "external_network_calls": 0,
    }


def generate_inventory(source_root: Path, output_path: Path) -> dict[str, int]:
    source_root = source_root.resolve(strict=True)
    if not source_root.is_dir():
        raise NotADirectoryError(source_root)
    stats = ScanStats()
    files = list(iter_source_files(source_root, stats))
    rows = [build_inventory_row(path, source_root) for path in files]
    rows.sort(key=lambda row: str(row["path"]).casefold())
    mark_possible_duplicates(rows)
    write_inventory(rows, output_path)
    return summarize(rows, stats)


def main() -> int:
    summary = generate_inventory(DEFAULT_SOURCE, DEFAULT_OUTPUT)
    labels = [
        ("Files scanned", "files_scanned"),
        ("Inventory rows", "inventory_rows"),
        ("Total size", "total_size"),
        ("Unique checksums", "unique_checksums"),
        ("Possible duplicates", "possible_duplicates"),
        ("Read errors", "read_errors"),
        ("Checksum errors", "checksum_errors"),
        ("Unsupported files", "unsupported_files"),
        ("Absolute paths detected", "absolute_paths_detected"),
        ("Outside paths detected", "outside_paths_detected"),
        ("Hidden files skipped", "hidden_skipped"),
        ("Reparse points skipped", "reparse_points_skipped"),
        ("Scan errors", "scan_errors"),
        ("External network calls", "external_network_calls"),
    ]
    for label, key in labels:
        print(f"{label}: {summary[key]}")
    return 0 if not any(summary[key] for key in ("read_errors", "checksum_errors", "absolute_paths_detected", "outside_paths_detected", "scan_errors")) else 1


if __name__ == "__main__":
    raise SystemExit(main())
