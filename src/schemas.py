from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional

class URLCreate(BaseModel):
    target_url: HttpUrl
    custom_code: Optional[str] = None

class URLInfo(BaseModel):
    target_url: str
    short_code: str
    click_count: int
    created_at: datetime
    last_accessed: Optional[datetime] = None

    class Config:
        from_attributes = True
