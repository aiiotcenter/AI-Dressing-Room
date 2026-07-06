from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import date
from typing import List
from pathlib import Path
import models
import schemas
import database
from services import cloudinary_service, ai_tryon_service

app = FastAPI(title="AI Virtual Dressing Room API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
models.Base.metadata.create_all(bind=database.engine)

# Serve uploaded user photos at /uploads/
UPLOADS_DIR = Path(__file__).parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Serve clothing assets at /assets/
ASSETS_DIR = Path(__file__).parent.parent / "assets"
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# Fixed clothing collection loaded from the assets folder
SEED_CLOTHES = [
    {"filename": "white-plain-tshirt.jpg",              "name": "White Plain T-Shirt",             "category": "Top"},
    {"filename": "beige-original-graphic-tshirt.jpg",   "name": "Beige Original Graphic T-Shirt",  "category": "Top"},
    {"filename": "cream-knit-fringe-poncho.jpg",        "name": "Cream Knit Fringe Poncho",        "category": "Top"},
    {"filename": "brown-bomber-jacket.jpg",             "name": "Brown Bomber Jacket",             "category": "Jacket"},
    {"filename": "white-shirt-dress.jpg",               "name": "White Shirt Dress",               "category": "Dress"},
    {"filename": "burgundy-midi-dress.jpg",             "name": "Burgundy Midi Dress",             "category": "Dress"},
    {"filename": "black-705-sweatshirt.jpg",            "name": "Black 705 Sweatshirt",            "category": "Top"},
    {"filename": "blue-orange-air-jordan-sneakers.jpg", "name": "Blue & Orange Air Jordan 1",      "category": "Casual"},
    {"filename": "black-yahweh-yireh-tshirt.jpg",       "name": "Black Yahweh Yireh T-Shirt",      "category": "Top"},
    {"filename": "navy-denim-jacket.jpg",               "name": "Navy Denim Jacket",               "category": "Jacket"},
    {"filename": "jeans.png",                           "name": "Classic Denim Jeans",             "category": "Pants"},
]


def seed_clothes(db: Session):
    """Insert asset clothing items on startup if they are not already in the database."""
    for item in SEED_CLOTHES:
        image_url = f"http://localhost:8000/assets/{item['filename']}"
        already_exists = db.query(models.Cloth).filter(models.Cloth.image_url == image_url).first()
        if not already_exists:
            cloth = models.Cloth(
                name=item["name"],
                category=item["category"],
                image_url=image_url,
                available_date=date(2020, 1, 1),  # Past date = always available
            )
            db.add(cloth)
    db.commit()


@app.on_event("startup")
def on_startup():
    db = database.SessionLocal()
    try:
        seed_clothes(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "AI Virtual Dressing Room API is running"}


@app.post("/upload-user-photo")
async def upload_user_photo(file: UploadFile = File(...)):
    """Upload a user photo and return its URL."""
    url = await cloudinary_service.upload_image(file)
    return {"url": url}


@app.post("/clothes", response_model=schemas.ClothResponse)
async def add_cloth(
    name: str = Form(...),
    category: str = Form(...),
    available_date: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
):
    """Add a new clothing item via the admin dashboard."""
    image_url = await cloudinary_service.upload_image(file)
    cloth = models.Cloth(
        name=name,
        category=category,
        image_url=image_url,
        available_date=date.fromisoformat(available_date),
    )
    db.add(cloth)
    db.commit()
    db.refresh(cloth)
    return cloth


@app.get("/clothes/today", response_model=List[schemas.ClothResponse])
def get_today_clothes(db: Session = Depends(database.get_db)):
    """Return clothing items available on or before today."""
    return (
        db.query(models.Cloth)
        .filter(models.Cloth.available_date <= date.today())
        .order_by(models.Cloth.name)
        .all()
    )


@app.get("/clothes", response_model=List[schemas.ClothResponse])
def get_all_clothes(db: Session = Depends(database.get_db)):
    """Return all clothing items in the database."""
    return db.query(models.Cloth).order_by(models.Cloth.created_at.desc()).all()


@app.post("/try-on", response_model=schemas.TryOnResultResponse)
async def try_on(
    request: schemas.TryOnRequest,
    db: Session = Depends(database.get_db),
):
    """Generate a virtual try-on result for a user photo and selected cloth."""
    cloth = db.query(models.Cloth).filter(models.Cloth.id == request.cloth_id).first()
    if not cloth:
        raise HTTPException(status_code=404, detail="Clothing item not found")

    try:
        generated_url = await ai_tryon_service.generate_tryon_image(
            request.user_photo_url,
            cloth.image_url,
            request.provider_api_key,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except ai_tryon_service.TryOnProviderError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    result = models.TryOnResult(
        user_photo_url=request.user_photo_url,
        cloth_id=cloth.id,
        cloth_image_url=cloth.image_url,
        cloth_name=cloth.name,
        generated_image_url=generated_url,
        status="completed",
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@app.get("/try-on/history", response_model=List[schemas.TryOnResultResponse])
def get_history(db: Session = Depends(database.get_db)):
    """Return all previous try-on results, newest first."""
    return (
        db.query(models.TryOnResult)
        .order_by(models.TryOnResult.created_at.desc())
        .all()
    )
