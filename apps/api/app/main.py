from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.config import get_settings
from app.db.session import Base, engine
from app.logging import configure_logging
from app.routers import auth, connections, health, scans

settings = get_settings()
configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP: create tables on boot. Replace with Alembic migrations in production.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Readiness Scanner API",
    version="0.1.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/v1")
app.include_router(connections.router, prefix="/v1")
app.include_router(scans.router, prefix="/v1")
