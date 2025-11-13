from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings


app = FastAPI(title="Recon API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin] if settings.frontend_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "env": settings.app_env}


@app.get("/")
def root():
    return {"name": "Recon API", "version": "0.1.0"}
