from __future__ import annotations

import csv
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path, PureWindowsPath
from unittest import mock


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPOSITORY_ROOT / "scripts" / "inventory" / "generate-knowledge-inventory.py"
SPEC = importlib.util.spec_from_file_location("knowledge_inventory", SCRIPT_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load {SCRIPT_PATH}")
inventory = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = inventory
SPEC.loader.exec_module(inventory)


class KnowledgeInventoryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.source = self.root / "cours esiea"
        self.source.mkdir()
        self.output = self.root / "knowledge-inventory.csv"

    def write_file(self, relative_path: str, content: bytes = b"content") -> Path:
        target = self.source / Path(relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return target

    def rows(self) -> list[dict[str, str]]:
        with self.output.open(encoding="utf-8", newline="") as handle:
            return list(csv.DictReader(handle))

    def test_normal_file_is_inventoried(self) -> None:
        self.write_file("2A/reseau/cours.pdf")
        summary = inventory.generate_inventory(self.source, self.output)
        self.assertEqual(summary["files_scanned"], 1)
        self.assertEqual(self.rows()[0]["status"], "INVENTORIED")

    def test_uppercase_extension_is_normalized(self) -> None:
        self.write_file("support.PDF")
        inventory.generate_inventory(self.source, self.output)
        self.assertEqual(self.rows()[0]["extension"], "pdf")

    def test_empty_file_is_reported(self) -> None:
        self.write_file("empty.txt", b"")
        inventory.generate_inventory(self.source, self.output)
        row = self.rows()[0]
        self.assertEqual(row["size"], "0")
        self.assertIn("Empty file", row["notes"])
        self.assertEqual(len(row["checksum"]), 64)

    def test_identical_files_are_marked_as_possible_duplicates(self) -> None:
        self.write_file("first.txt", b"same")
        self.write_file("nested/second.txt", b"same")
        summary = inventory.generate_inventory(self.source, self.output)
        rows = self.rows()
        self.assertEqual(summary["unique_checksums"], 1)
        self.assertEqual(summary["possible_duplicates"], 2)
        self.assertEqual({row["possible_duplicate"] for row in rows}, {"YES"})

    def test_inaccessible_file_is_simulated_without_stopping(self) -> None:
        target = self.write_file("blocked.txt")
        with mock.patch.object(inventory, "hash_file", side_effect=PermissionError):
            row = inventory.build_inventory_row(target, self.source, hasher=inventory.hash_file)
        self.assertEqual(row["status"], "READ_ERROR")
        self.assertEqual(row["checksum"], "")
        self.assertIn("Unreadable file", row["notes"])

    def test_folder_with_spaces_is_preserved(self) -> None:
        self.write_file("folder with spaces/my file.txt")
        inventory.generate_inventory(self.source, self.output)
        self.assertEqual(self.rows()[0]["path"], "folder with spaces/my file.txt")

    def test_unicode_path_is_preserved(self) -> None:
        self.write_file("réseau/épreuve.pdf")
        inventory.generate_inventory(self.source, self.output)
        self.assertEqual(self.rows()[0]["path"], "réseau/épreuve.pdf")

    def test_path_outside_source_is_rejected(self) -> None:
        outside = self.root / "outside.txt"
        outside.write_text("outside", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "outside authorized source root"):
            inventory.relative_inventory_path(outside, self.source)

    def test_columns_are_exact_and_ordered(self) -> None:
        self.write_file("file.txt")
        inventory.generate_inventory(self.source, self.output)
        with self.output.open(encoding="utf-8", newline="") as handle:
            header = next(csv.reader(handle))
        self.assertEqual(header, inventory.FIELDNAMES)

    def test_output_contains_no_absolute_path(self) -> None:
        self.write_file("nested/file.txt")
        summary = inventory.generate_inventory(self.source, self.output)
        path_value = self.rows()[0]["path"]
        self.assertFalse(Path(path_value).is_absolute())
        self.assertFalse(PureWindowsPath(path_value).is_absolute())
        self.assertEqual(summary["absolute_paths_detected"], 0)

    def test_hidden_entries_are_excluded(self) -> None:
        self.write_file("visible.txt")
        self.write_file(".env", b"synthetic-test-only")
        summary = inventory.generate_inventory(self.source, self.output)
        self.assertEqual(summary["files_scanned"], 1)
        self.assertEqual(self.rows()[0]["path"], "visible.txt")
        self.assertEqual(summary["hidden_skipped"], 1)


if __name__ == "__main__":
    unittest.main()
