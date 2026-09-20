import secrets
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel, HttpUrl
from datetime import datetime, timezone

SQLALCHEMY_DATABASE_URL = "sqlite:///./shortener.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class URLItem(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    target_url = Column(String, index=True)
    short_code = Column(String, unique=True, index=True)
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_accessed = Column(DateTime, nullable=True)

Base.metadata.create_all(bind=engine)

class URLCreate(BaseModel):
    target_url: HttpUrl

class URLInfo(BaseModel):
    target_url: str
    short_code: str
    click_count: int
    created_at: datetime
    last_accessed: datetime | None = None

    class Config:
        from_attributes = True

app = FastAPI(title="URL Shortener API")

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/url", response_model=URLInfo)
def create_url(url: URLCreate, db: Session = Depends(get_db)):
    # Generate a random 5-character string
    chars = secrets.token_urlsafe(4)[:5]

    db_url = URLItem(target_url=str(url.target_url), short_code=chars)
    db.add(db_url)
    db.commit()
    db.refresh(db_url)
    return db_url

@app.get("/{short_code}")
def redirect_to_url(short_code: str, db: Session = Depends(get_db)):
    db_url = db.query(URLItem).filter(URLItem.short_code == short_code).first()

    if db_url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")

    # Update analytics
    db_url.click_count += 1
    db_url.last_accessed = datetime.now(timezone.utc)
    db.commit()

    return RedirectResponse(url=db_url.target_url)

@app.get("/stats/{short_code}", response_model=URLInfo)
def get_url_stats(short_code: str, db: Session = Depends(get_db)):
    db_url = db.query(URLItem).filter(URLItem.short_code == short_code).first()

    if db_url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")

    return db_url
