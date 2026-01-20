from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    
db_instance = Database()

async def get_database():
    return db_instance.client[settings.DB_NAME]

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URL)
    logger.info("Connected to MongoDB!")

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    db_instance.client.close()
    logger.info("MongoDB connection closed!")
