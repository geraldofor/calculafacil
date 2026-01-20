from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api import auth, calculations

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Sistema Unificado de Cálculos para Consolidadoras de Viagens",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup():
    logger.info("Starting up Calcula Fácil API...")
    await connect_to_mongo()
    logger.info("API ready!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down...")
    await close_mongo_connection()

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "calcula-facil"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(calculations.router, prefix="/api/calculations", tags=["Calculations"])