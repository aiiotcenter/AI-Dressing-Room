"""
AI Try-On Service — OpenRouter / Google Gemini Image Generation

Sends the user's photo and the selected clothing image to Google Gemini
(via OpenRouter) to generate a photorealistic virtual try-on result.

The app uses a bring-your-own-key flow for graduation/demo use:
the frontend sends the user's provider API key to this backend for one request,
the backend forwards it to the provider, and the key is not saved.
"""

import base64
import mimetypes
import os
import uuid
import httpx
from pathlib import Path
from dotenv import load_dotenv

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GOOGLE_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent"
MODEL = "google/gemini-2.5-flash-image"

# Where generated images are saved (served at /uploads/ by FastAPI)
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class TryOnProviderError(Exception):
    """Raised when the external AI provider rejects or fails a try-on request."""


async def _fetch_image_bytes(url: str) -> bytes:
    """Download an image from a URL (including localhost) and return raw bytes."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content


def _guess_image_mime_type(url: str) -> str:
    mime_type, _ = mimetypes.guess_type(url.split("?", 1)[0])
    return mime_type or "image/jpeg"


def _tryon_prompt() -> str:
    return (
        "You are a virtual try-on system. "
        "The first image is a person (the customer). "
        "The second image is a clothing item. "
        "Generate a single photorealistic image showing the person wearing the clothing item. "
        "Preserve the person's face, body shape, skin tone, and pose exactly. "
        "Make the clothing fit naturally with realistic lighting, shadows, and fabric folds. "
        "Output only the try-on image with no extra text."
    )


def _save_generated_image(image_bytes: bytes, mime_type: str = "image/png") -> str:
    ext = ".png" if "png" in mime_type else ".jpg"
    filename = f"tryon_{uuid.uuid4().hex}{ext}"
    (UPLOADS_DIR / filename).write_bytes(image_bytes)
    return f"http://localhost:8000/uploads/{filename}"


def _configured_api_key() -> str:
    return (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("OPENROUTER_API_KEY")
        or os.getenv("PROVIDER_API_KEY")
        or ""
    ).strip()


def _is_google_api_key(api_key: str) -> bool:
    return api_key.startswith(("AIza", "AQ."))


async def generate_tryon_image(user_photo_url: str, cloth_image_url: str, api_key: str | None = None) -> str:
    """
    Generate a virtual try-on image using Google Gemini via OpenRouter.

    Args:
        user_photo_url:  URL of the user's photo (can be localhost).
        cloth_image_url: URL of the selected clothing item (can be localhost).

    Returns:
        Local URL of the generated try-on image saved under /uploads/.
    """
    api_key = (api_key or "").strip() or _configured_api_key()
    if not api_key:
        raise ValueError("Add a Gemini API key in backend/.env or paste a provider key in the app.")

    if _is_google_api_key(api_key):
        return await _generate_google_tryon_image(user_photo_url, cloth_image_url, api_key)

    return await _generate_openrouter_tryon_image(user_photo_url, cloth_image_url, api_key)


async def _generate_openrouter_tryon_image(user_photo_url: str, cloth_image_url: str, api_key: str) -> str:
    # Download both images and encode as base64
    user_bytes  = await _fetch_image_bytes(user_photo_url)
    cloth_bytes = await _fetch_image_bytes(cloth_image_url)

    user_b64  = base64.b64encode(user_bytes).decode()
    cloth_b64 = base64.b64encode(cloth_bytes).decode()

    payload = {
        "model": MODEL,
        "modalities": ["image", "text"],
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _tryon_prompt()},
                    {"type": "image_url", "image_url": {"url": f"data:{_guess_image_mime_type(user_photo_url)};base64,{user_b64}"}},
                    {"type": "image_url", "image_url": {"url": f"data:{_guess_image_mime_type(cloth_image_url)};base64,{cloth_b64}"}},
                ],
            }
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as error:
        status_code = error.response.status_code
        if status_code == 401:
            raise TryOnProviderError("AI provider rejected the API key.") from error
        if status_code == 429:
            raise TryOnProviderError("AI provider quota is exhausted or rate limited.") from error
        raise TryOnProviderError(f"AI provider request failed with status {status_code}.") from error

    data = response.json()
    message = data["choices"][0]["message"]
    images = message.get("images", [])

    if not images:
        raise ValueError("The AI provider did not return an image.")

    # Parse the base64 data URL returned by the model
    image_data_url: str = images[0]["image_url"]["url"]
    header, b64_data = image_data_url.split(",", 1)
    image_bytes = base64.b64decode(b64_data)
    return _save_generated_image(image_bytes, header)


async def _generate_google_tryon_image(user_photo_url: str, cloth_image_url: str, api_key: str) -> str:
    user_bytes = await _fetch_image_bytes(user_photo_url)
    cloth_bytes = await _fetch_image_bytes(cloth_image_url)

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": _tryon_prompt()},
                    {
                        "inline_data": {
                            "mime_type": _guess_image_mime_type(user_photo_url),
                            "data": base64.b64encode(user_bytes).decode(),
                        }
                    },
                    {
                        "inline_data": {
                            "mime_type": _guess_image_mime_type(cloth_image_url),
                            "data": base64.b64encode(cloth_bytes).decode(),
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
        },
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                GOOGLE_GEMINI_URL,
                headers={
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as error:
        status_code = error.response.status_code
        if status_code == 400:
            raise TryOnProviderError("AI provider rejected the image or request format.") from error
        if status_code == 401:
            raise TryOnProviderError("AI provider rejected the API key.") from error
        if status_code == 429:
            raise TryOnProviderError("AI provider quota is exhausted or rate limited.") from error
        raise TryOnProviderError(f"AI provider request failed with status {status_code}.") from error

    data = response.json()
    parts = data["candidates"][0]["content"]["parts"]
    for part in parts:
        inline_data = part.get("inlineData") or part.get("inline_data")
        if inline_data:
            image_data = inline_data["data"]
            mime_type = inline_data.get("mimeType") or inline_data.get("mime_type") or "image/png"
            return _save_generated_image(base64.b64decode(image_data), mime_type)

    raise ValueError("The AI provider did not return an image.")
