import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    # Force an absolute path directly to the 'database' folder in our repo
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'database', 'red_pulse.db')
    
    # In production, use the DATABASE_URL provided by the host (PostgreSQL).
    # If not provided, fallback to the local SQLite database for development.
    db_uri = os.getenv('DATABASE_URL')
    if db_uri and db_uri.startswith("postgres://"):
        db_uri = db_uri.replace("postgres://", "postgresql+pg8000://", 1) # Fix for Render/Heroku URIs
    elif db_uri and db_uri.startswith("postgresql://"):
        db_uri = db_uri.replace("postgresql://", "postgresql+pg8000://", 1)
        
    SQLALCHEMY_DATABASE_URI = db_uri or f"sqlite:///{db_path}"
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = os.getenv('DEBUG', 'True') == 'True'
    PORT = int(os.getenv('PORT', 5000))
    
    # Email settings for SOS updates
    SMTP_SERVER = os.getenv('SMTP_SERVER')
    SMTP_PORT = os.getenv('SMTP_PORT', 587)
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
