# Multi-stage Dockerfile for Resume Intelligence

# --- Stage 1: Build Frontend ---
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# --- Stage 2: Serve Backend + Frontend ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY Backend/requirements.txt ./Backend/
RUN pip install --no-cache-dir -r Backend/requirements.txt
RUN pip install gunicorn

# Pre-download NLTK data at build time (not runtime)
RUN python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True); nltk.download('punkt_tab', quiet=True)"

COPY Backend/ ./Backend/

# Copy frontend build from Stage 1
COPY --from=frontend-build /app/frontend/build ./Backend/static

# Set Environment Variables
ENV FLASK_APP=Backend/app.py
ENV PYTHONPATH=/app/Backend

# Expose port
EXPOSE 5000

# Run the app with optimized gunicorn settings
WORKDIR /app/Backend
CMD ["gunicorn", "--preload", "--workers", "2", "--threads", "2", "--timeout", "120", "--bind", "0.0.0.0:5000", "app:app"]
