import unittest
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database
import main
import models


class BringYourOwnApiKeyTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        models.Base.metadata.create_all(bind=engine)

        self.db = TestingSessionLocal()
        self.cloth = models.Cloth(
            name="Burgundy Midi Dress",
            category="Dress",
            image_url="http://testserver/assets/burgundy-midi-dress.jpg",
            available_date=date(2020, 1, 1),
        )
        self.db.add(self.cloth)
        self.db.commit()
        self.db.refresh(self.cloth)

        def override_get_db():
            try:
                yield self.db
            finally:
                pass

        main.app.dependency_overrides[database.get_db] = override_get_db
        self.client = TestClient(main.app, raise_server_exceptions=False)

    def tearDown(self):
        main.app.dependency_overrides.clear()
        self.db.close()

    def test_try_on_passes_user_api_key_to_backend_service_without_persisting_it(self):
        captured = {}

        async def fake_generate_tryon_image(user_photo_url, cloth_image_url, api_key):
            captured["user_photo_url"] = user_photo_url
            captured["cloth_image_url"] = cloth_image_url
            captured["api_key"] = api_key
            return "http://testserver/uploads/generated.jpg"

        original_generate = main.ai_tryon_service.generate_tryon_image
        main.ai_tryon_service.generate_tryon_image = fake_generate_tryon_image
        try:
            response = self.client.post(
                "/try-on",
                json={
                    "user_photo_url": "http://testserver/uploads/user.jpg",
                    "cloth_id": self.cloth.id,
                    "provider_api_key": "sk-user-owned-secret",
                },
            )
        finally:
            main.ai_tryon_service.generate_tryon_image = original_generate

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(captured["api_key"], "sk-user-owned-secret")
        self.assertEqual(captured["cloth_image_url"], self.cloth.image_url)

        saved_result = self.db.query(models.TryOnResult).one()
        self.assertEqual(saved_result.generated_image_url, "http://testserver/uploads/generated.jpg")
        self.assertNotIn("sk-user-owned-secret", response.text)
        self.assertFalse(hasattr(saved_result, "provider_api_key"))


if __name__ == "__main__":
    unittest.main()
