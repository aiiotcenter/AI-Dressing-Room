import unittest

from services import ai_tryon_service


class AiTryOnServiceProviderSelectionTests(unittest.IsolatedAsyncioTestCase):
    async def test_google_api_key_uses_direct_gemini_provider(self):
        calls = []

        async def fake_google(user_photo_url, cloth_image_url, api_key):
            calls.append(("google", user_photo_url, cloth_image_url, api_key))
            return "http://testserver/uploads/google-result.png"

        async def fake_openrouter(user_photo_url, cloth_image_url, api_key):
            calls.append(("openrouter", user_photo_url, cloth_image_url, api_key))
            return "http://testserver/uploads/openrouter-result.png"

        original_google = ai_tryon_service._generate_google_tryon_image
        original_openrouter = ai_tryon_service._generate_openrouter_tryon_image
        ai_tryon_service._generate_google_tryon_image = fake_google
        ai_tryon_service._generate_openrouter_tryon_image = fake_openrouter
        try:
            result = await ai_tryon_service.generate_tryon_image(
                "http://testserver/uploads/person.jpg",
                "http://testserver/assets/shirt.jpg",
                "AIza-user-key",
            )
        finally:
            ai_tryon_service._generate_google_tryon_image = original_google
            ai_tryon_service._generate_openrouter_tryon_image = original_openrouter

        self.assertEqual(result, "http://testserver/uploads/google-result.png")
        self.assertEqual(calls, [
            (
                "google",
                "http://testserver/uploads/person.jpg",
                "http://testserver/assets/shirt.jpg",
                "AIza-user-key",
            )
        ])

    async def test_google_ai_studio_aq_key_uses_direct_gemini_provider(self):
        calls = []

        async def fake_google(user_photo_url, cloth_image_url, api_key):
            calls.append(("google", user_photo_url, cloth_image_url, api_key))
            return "http://testserver/uploads/google-result.png"

        async def fake_openrouter(user_photo_url, cloth_image_url, api_key):
            calls.append(("openrouter", user_photo_url, cloth_image_url, api_key))
            return "http://testserver/uploads/openrouter-result.png"

        original_google = ai_tryon_service._generate_google_tryon_image
        original_openrouter = ai_tryon_service._generate_openrouter_tryon_image
        ai_tryon_service._generate_google_tryon_image = fake_google
        ai_tryon_service._generate_openrouter_tryon_image = fake_openrouter
        try:
            result = await ai_tryon_service.generate_tryon_image(
                "http://testserver/uploads/person.jpg",
                "http://testserver/assets/shirt.jpg",
                "AQ.google-ai-studio-key",
            )
        finally:
            ai_tryon_service._generate_google_tryon_image = original_google
            ai_tryon_service._generate_openrouter_tryon_image = original_openrouter

        self.assertEqual(result, "http://testserver/uploads/google-result.png")
        self.assertEqual(calls, [
            (
                "google",
                "http://testserver/uploads/person.jpg",
                "http://testserver/assets/shirt.jpg",
                "AQ.google-ai-studio-key",
            )
        ])

    async def test_non_google_key_keeps_openrouter_provider(self):
        calls = []

        async def fake_google(user_photo_url, cloth_image_url, api_key):
            calls.append(("google", user_photo_url, cloth_image_url, api_key))
            return "http://testserver/uploads/google-result.png"

        async def fake_openrouter(user_photo_url, cloth_image_url, api_key):
            calls.append(("openrouter", user_photo_url, cloth_image_url, api_key))
            return "http://testserver/uploads/openrouter-result.png"

        original_google = ai_tryon_service._generate_google_tryon_image
        original_openrouter = ai_tryon_service._generate_openrouter_tryon_image
        ai_tryon_service._generate_google_tryon_image = fake_google
        ai_tryon_service._generate_openrouter_tryon_image = fake_openrouter
        try:
            result = await ai_tryon_service.generate_tryon_image(
                "http://testserver/uploads/person.jpg",
                "http://testserver/assets/shirt.jpg",
                "sk-or-user-key",
            )
        finally:
            ai_tryon_service._generate_google_tryon_image = original_google
            ai_tryon_service._generate_openrouter_tryon_image = original_openrouter

        self.assertEqual(result, "http://testserver/uploads/openrouter-result.png")
        self.assertEqual(calls, [
            (
                "openrouter",
                "http://testserver/uploads/person.jpg",
                "http://testserver/assets/shirt.jpg",
                "sk-or-user-key",
            )
        ])


if __name__ == "__main__":
    unittest.main()
