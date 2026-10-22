import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config import settings
from app.routers import (
    health_router,
    meals_router,
    chat_router,
    common_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ai_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"🌐 Environment: {settings.ENV}")
    logger.info(f"🔑 Gemini API Key configured: {bool(settings.GEMINI_API_KEY)}")
    logger.info(f"🤖 Default Model: {settings.DEFAULT_MODEL}")
    logger.info("=" * 60)
    yield
    logger.info("🛑 Shutting down AI service...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Dedicated AI Microservice for Nutricount: multimodal meal nutrition analysis, fitness coach chat, and generative AI features.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(health_router)
app.include_router(meals_router)
app.include_router(chat_router)
app.include_router(common_router)

def start():
    """Entry point for running directly or via cli."""
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENV == "development",
    )

if __name__ == "__main__":
    start()
