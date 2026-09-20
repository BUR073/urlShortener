from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from database import Base

class URLItem(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    target_url = Column(String, index=True)
    short_code = Column(String, unique=True, index=True)
    click_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_accessed = Column(DateTime, nullable=True)
