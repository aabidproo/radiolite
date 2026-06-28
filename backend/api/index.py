# Vercel serverless entry point for FastAPI
# Vercel looks for `app` in api/index.py
import sys
import os

# Add the backend root to the path so we can import `app`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
