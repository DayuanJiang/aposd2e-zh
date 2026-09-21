import unittest
import xml.etree.ElementTree as ET

from verify import marked_path_issues


class SvgMarkers(unittest.TestCase):
    def test_inherited_end_marker_catches_multiple_subpaths(self):
        root = ET.fromstring('<svg><g marker-end="url(#a)"><path d="M0 0V10M20 0V10"/></g></svg>')
        self.assertEqual(marked_path_issues(root), ["M0 0V10M20 0V10"])

    def test_separate_arrows_and_unmarked_grid_lines_are_allowed(self):
        root = ET.fromstring('<svg><g marker-end="url(#a)"><path d="M0 0V10"/><path d="M20 0V10"/></g><path d="M0 0H20M0 10H20"/></svg>')
        self.assertEqual(marked_path_issues(root), [])

    def test_explicit_none_overrides_marker_inheritance(self):
        root = ET.fromstring('<svg marker-end="url(#a)"><path marker-end="none" d="M0 0H10M20 0H30"/></svg>')
        self.assertEqual(marked_path_issues(root), [])


if __name__ == "__main__":
    unittest.main()
