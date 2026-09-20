import secrets
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import SessionLocal
import models
import schemas

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

def get_url_by_code(db: Session, short_code: str):
    return db.query(models.URLItem).filter(models.URLItem.short_code == short_code).first()

@router.post("/url", response_model=schemas.URLInfo)
def create_url(url: schemas.URLCreate, db: Session = Depends(get_db)):
    if url.custom_code:
        custom_code = url.custom_code.strip()

        existing = get_url_by_code(db, custom_code)
        if existing:
            raise HTTPException(status_code=400, detail="Custom code already taken.")
        chars = custom_code
    else:
        while True:
            chars = secrets.token_urlsafe(4)[:5]
            if not get_url_by_code(db, chars):
                break

    db_url = models.URLItem(target_url=str(url.target_url), short_code=chars)
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    return db_url


@router.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    db_url = get_url_by_code(db, short_code)

    if db_url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")

    db_url.click_count += 1
    db_url.last_accessed = datetime.now(timezone.utc)
    db.commit()

    return RedirectResponse(url=db_url.target_url)

@router.get("/stats/{short_code}", response_model=schemas.URLInfo)
def get_url_stats(short_code: str, db: Session = Depends(get_db)):
    db_url = get_url_by_code(db, short_code)

    if db_url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")

    return db_url
