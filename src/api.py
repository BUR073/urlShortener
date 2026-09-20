import secrets
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import SessionLocal
import models
import schemas

# Create an APIRouter instance instead of FastAPI()
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def read_root():
    return RedirectResponse(url="/docs")

@router.post("/url", response_model=schemas.URLInfo)
def create_url(url: schemas.URLCreate, db: Session = Depends(get_db)):
    chars = secrets.token_urlsafe(4)[:5]

    db_url = models.URLItem(target_url=str(url.target_url), short_code=chars)
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    return db_url

@router.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    db_url = db.query(models.URLItem).filter(models.URLItem.short_code == short_code).first()

    if db_url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")

    db_url.click_count += 1
    db_url.last_accessed = datetime.now(timezone.utc)
    db.commit()

    return RedirectResponse(url=db_url.target_url)

@router.get("/stats/{short_code}", response_model=schemas.URLInfo)
def get_url_stats(short_code: str, db: Session = Depends(get_db)):
    db_url = db.query(models.URLItem).filter(models.URLItem.short_code == short_code).first()

    if db_url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")

    return db_url
