from fastapi import FastAPI
from database import engine
import models
import api

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="URL Shortener API")

app.include_router(api.router)
