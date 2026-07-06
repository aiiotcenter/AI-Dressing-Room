import unittest
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database
import main
import models


class ProviderErrorTests(unittest.TestCase):
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
            name="Beige Original Graphic T-Shirt",
            category="Top",
            image_url="http://testserver/assets/beige-original-graphic-tshirt.jpg",
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

    def test_provider_error_returns_clear_bad_gateway_message(self):
        async def fake_generate_tryon_image(user_photo_url, cloth_image_url, api_key):
            raise main.ai_tryon_service.TryOnProviderError("AI provider quota is exhausted.")

        original_generate = main.ai_tryon_service.generate_tryon_image
        main.ai_tryon_service.generate_tryon_image = fake_generate_tryon_image
        try:
            response = self.client.post(
                "/try-on",
                json={
                    "user_photo_url": "http://testserver/uploads/person.jpg",
                    "cloth_id": self.cloth.id,
                    "provider_api_key": "AIza-user-owned-secret",
                },
            )
        finally:
            main.ai_tryon_service.generate_tryon_image = original_generate

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["detail"], "AI provider quota is exhausted.")


if __name__ == "__main__":
    unittest.main()
