import ast
import io
import json
from pathlib import Path
import pickle
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = {
    entry["id"]: entry
    for file in (ROOT / "docs/.vuepress/reader/examples").glob("*.json")
    for entry in json.loads(file.read_text())
}


class TeachingExamples(unittest.TestCase):
    def test_all_examples_parse_and_compile(self):
        self.assertEqual(len(EXAMPLES), 60)
        for name, entry in EXAMPLES.items():
            with self.subTest(name=name):
                compile(ast.parse(entry["python"]), name, "exec")

    def test_literal_placeholder_behavior_is_disclosed(self):
        for name, functions in {
            "ch05-f2": ["getParameter", "getIntParameter"],
            "ch06-f1": ["backspace", "delete"],
        }.items():
            entry = EXAMPLES[name]
            namespace = {}
            exec(entry["python"], namespace)
            for function in functions:
                self.assertIsNone(namespace[function](None, None))
            self.assertIn("None", entry["note"])
            self.assertIn("return None", entry["noteEn"])

    def load_tweets(self, data, count=1):
        namespace = {"fileName": "in-memory", "Tweet": int, "tweetsPerFile": count, "tweets": []}
        with patch.object(io, "FileIO", return_value=io.BytesIO(data)):
            exec(EXAMPLES["ch10-f1"]["python"], namespace)
        return namespace["tweets"]

    def test_format_failure_boundary_is_explicit(self):
        with self.assertRaisesRegex(ValueError, "unsupported pickle protocol"):
            self.load_tweets(b"\x80\xff.")
        self.assertIn("ValueError", EXAMPLES["ch10-f1"]["note"])
        self.assertIn("not exhaustive", EXAMPLES["ch10-f1"]["noteEn"])
        self.assertEqual(self.load_tweets(pickle.dumps(123), count=2), [123])
        self.assertEqual(self.load_tweets(pickle.dumps(None)), [None])
        self.assertEqual(self.load_tweets(pickle.dumps("wrong type")), [])

    def test_mixed_originals_are_honestly_labelled(self):
        for name in ["ch13-f5", "ch13-f6"]:
            self.assertEqual(EXAMPLES[name]["originalLanguage"], "C++ / Java")
        self.assertEqual(EXAMPLES["ch14-f1"]["originalLanguage"], "cpp")
        self.assertEqual(EXAMPLES["ch18-f5"]["originalLanguage"], "cpp")


if __name__ == "__main__":
    unittest.main()
