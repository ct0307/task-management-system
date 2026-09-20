import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import parse_engine


class _OpenedImage:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False


def _fake_modules(*, text="识别结果", open_error=None):
    pil = types.ModuleType("PIL")

    def open_image(_filepath):
        if open_error is not None:
            raise open_error
        return _OpenedImage()

    pil.Image = types.SimpleNamespace(open=open_image)
    pytesseract = types.ModuleType("pytesseract")
    pytesseract.image_to_string = lambda image, lang: text
    return {"PIL": pil, "pytesseract": pytesseract}


class OcrImageTests(unittest.TestCase):
    def test_returns_text_and_full_text_for_recognized_image(self):
        with patch.dict(sys.modules, _fake_modules(text="  周一 高等数学  ")):
            result = parse_engine.ocr_image("schedule.png")

        self.assertEqual(result, {
            "text": "周一 高等数学",
            "full_text": "周一 高等数学",
        })

    def test_returns_explicit_error_for_empty_ocr_result(self):
        with patch.dict(sys.modules, _fake_modules(text="  \n ")):
            result = parse_engine.ocr_image("blank.png")

        self.assertEqual(result, {
            "error": "OCR 未识别到文字",
            "text": "",
            "full_text": "",
        })

    def test_returns_explicit_error_when_image_cannot_be_opened(self):
        modules = _fake_modules(open_error=OSError("bad image"))
        with patch.dict(sys.modules, modules):
            result = parse_engine.ocr_image("broken.png")

        self.assertEqual(result, {"error": "图片 OCR 失败: bad image"})


if __name__ == "__main__":
    unittest.main()

