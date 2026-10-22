from .health import router as health_router
from .meals import router as meals_router
from .chat import router as chat_router
from .common import router as common_router

__all__ = ["health_router", "meals_router", "chat_router", "common_router"]
