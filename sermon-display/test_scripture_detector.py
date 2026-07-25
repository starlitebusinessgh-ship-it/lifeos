"""Tests for scripture_detector.detect_references."""

from __future__ import annotations

import unittest

from scripture_detector import detect_quote, detect_references


class DetectReferencesTests(unittest.TestCase):
    def _one(self, text: str) -> dict:
        hits = detect_references(text)
        self.assertEqual(len(hits), 1, msg=f"{text!r} -> {hits}")
        return hits[0]

    def test_explicit_chapter_verse_words(self):
        hit = self._one("Romans chapter eight verse twenty-eight")
        self.assertEqual(hit["book"], "Romans")
        self.assertEqual(hit["chapter"], 8)
        self.assertEqual(hit["verse"], 28)
        self.assertIsNone(hit["verse_end"])
        self.assertGreaterEqual(hit["confidence"], 0.9)

    def test_compressed_romans_eight_twenty_eight(self):
        hit = self._one("Romans eight twenty-eight")
        self.assertEqual(hit["book"], "Romans")
        self.assertEqual(hit["chapter"], 8)
        self.assertEqual(hit["verse"], 28)

    def test_chapter_only(self):
        hit = self._one("Romans chapter eight")
        self.assertEqual(hit["book"], "Romans")
        self.assertEqual(hit["chapter"], 8)
        self.assertIsNone(hit["verse"])

    def test_range_through(self):
        hit = self._one(
            "Romans eight, verse twenty-eight through thirty"
        )
        self.assertEqual(hit["book"], "Romans")
        self.assertEqual(hit["chapter"], 8)
        self.assertEqual(hit["verse"], 28)
        self.assertEqual(hit["verse_end"], 30)

    def test_first_corinthians_chapter_only(self):
        hit = self._one("First Corinthians thirteen")
        self.assertEqual(hit["book"], "1 Corinthians")
        self.assertEqual(hit["chapter"], 13)
        self.assertIsNone(hit["verse"])

    def test_1_corinthians_digits(self):
        hit = self._one("1 Corinthians 13")
        self.assertEqual(hit["book"], "1 Corinthians")
        self.assertEqual(hit["chapter"], 13)

    def test_first_corinthians_chapter_word(self):
        hit = self._one("First Corinthians chapter thirteen")
        self.assertEqual(hit["book"], "1 Corinthians")
        self.assertEqual(hit["chapter"], 13)
        self.assertIsNone(hit["verse"])

    def test_second_samuel(self):
        hit = self._one("Second Samuel chapter twenty two verse one")
        self.assertEqual(hit["book"], "2 Samuel")
        self.assertEqual(hit["chapter"], 22)
        self.assertEqual(hit["verse"], 1)

    def test_2_samuel_digits(self):
        hit = self._one("2 Samuel 7:12")
        self.assertEqual(hit["book"], "2 Samuel")
        self.assertEqual(hit["chapter"], 7)
        self.assertEqual(hit["verse"], 12)

    def test_run_together_eight_twenty_eight(self):
        hit = self._one("Romans eight twenty eight")
        self.assertEqual(hit["book"], "Romans")
        self.assertEqual(hit["chapter"], 8)
        self.assertEqual(hit["verse"], 28)

    def test_john_316_digits(self):
        hit = self._one("John 3:16")
        self.assertEqual(hit["book"], "John")
        self.assertEqual(hit["chapter"], 3)
        self.assertEqual(hit["verse"], 16)

    def test_psalm_alias(self):
        hit = self._one("Psalm twenty three")
        self.assertEqual(hit["book"], "Psalms")
        self.assertEqual(hit["chapter"], 23)

    def test_revelations_plural_alias(self):
        hit = self._one("Revelations chapter twenty one verse four")
        self.assertEqual(hit["book"], "Revelation")
        self.assertEqual(hit["chapter"], 21)
        self.assertEqual(hit["verse"], 4)

    def test_messy_whisper_corinthians(self):
        # Apostrophe / possessive-ish Whisper artifact
        hit = self._one("First Corinthian's chapter thirteen verse four")
        self.assertEqual(hit["book"], "1 Corinthians")
        self.assertEqual(hit["chapter"], 13)
        self.assertEqual(hit["verse"], 4)

    def test_turn_with_to_phrasing(self):
        hit = self._one("Let's turn to Romans chapter eight verse twenty eight")
        self.assertEqual(hit["book"], "Romans")
        self.assertEqual(hit["chapter"], 8)
        self.assertEqual(hit["verse"], 28)

    def test_false_positive_breakfast(self):
        self.assertEqual(detect_references("I ate breakfast at eight"), [])

    def test_false_positive_page_eight(self):
        self.assertEqual(detect_references("Let's turn to page eight"), [])

    def test_false_positive_no_book(self):
        self.assertEqual(
            detect_references("chapter eight verse twenty-eight"),
            [],
        )

    def test_false_positive_bare_corinthians_without_ordinal(self):
        # Too ambiguous without First/Second
        self.assertEqual(detect_references("Corinthians thirteen"), [])

    def test_detect_quote_stub(self):
        self.assertIsNone(
            detect_quote("For God so loved the world that he gave")
        )


if __name__ == "__main__":
    unittest.main()
