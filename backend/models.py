from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from datetime import datetime
from database import Base


class Cloth(Base):
    __tablename__ = "clothes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    available_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TryOnResult(Base):
    __tablename__ = "try_on_results"

    id = Column(Integer, primary_key=True, index=True)
    user_photo_url = Column(String, nullable=False)
    cloth_id = Column(Integer, ForeignKey("clothes.id"))
    cloth_image_url = Column(String, nullable=False)
    cloth_name = Column(String, nullable=True)
    generated_image_url = Column(String, nullable=False)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)
