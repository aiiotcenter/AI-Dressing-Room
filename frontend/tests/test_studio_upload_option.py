import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
STUDIO_FILE = ROOT / "src" / "pages" / "TryOnStudio.jsx"


class TryOnStudioUploadOptionTest(unittest.TestCase):
    def test_studio_offers_image_upload_as_camera_alternative(self):
        source = STUDIO_FILE.read_text()

        self.assertIn('type="file"', source)
        self.assertIn('accept="image/*"', source)
        self.assertIn("Upload Photo", source)
        self.assertIn("handlePhotoFileChange", source)


if __name__ == "__main__":
    unittest.main()
