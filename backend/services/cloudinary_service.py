import cloudinary
import cloudinary.uploader
import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

load_dotenv()

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
API_KEY = os.getenv("CLOUDINARY_API_KEY")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

CLOUDINARY_CONFIGURED = bool(CLOUD_NAME and API_KEY and API_SECRET)

# Local uploads folder sits next to this file's parent (backend/uploads/)
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

if CLOUDINARY_CONFIGURED:
    cloudinary.config(
        cloud_name=CLOUD_NAME,
        api_key=API_KEY,
        api_secret=API_SECRET,
    )


async def upload_image(file: UploadFile) -> str:
    """
    Upload an image to Cloudinary and return its public URL.
    If Cloudinary is not configured, save the file locally and return a
    local server URL (served by FastAPI's StaticFiles at /uploads/).
    """
    contents = await file.read()

    if not CLOUDINARY_CONFIGURED:
        # Save to backend/uploads/ and return a local URL.
        ext = Path(file.filename).suffix if file.filename else ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOADS_DIR / filename
        dest.write_bytes(contents)
        # FastAPI serves /uploads/ as a static mount (see main.py)
        return f"http://localhost:8000/uploads/{filename}"

    # Cloudinary path
    tmp_path = UPLOADS_DIR / f"tmp_{uuid.uuid4().hex}.jpg"
    try:
        tmp_path.write_bytes(contents)
        result = cloudinary.uploader.upload(str(tmp_path), folder="ai-dressing-room")
        return result["secure_url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()
