from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class ClothResponse(BaseModel):
    id: int
    name: str
    category: str
    image_url: str
    available_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class TryOnRequest(BaseModel):
    user_photo_url: str
    cloth_id: int
    provider_api_key: Optional[str] = Field(default=None, repr=False)


class TryOnResultResponse(BaseModel):
    id: int
    user_photo_url: str
    cloth_id: int
    cloth_image_url: str
    cloth_name: Optional[str] = None
    generated_image_url: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
