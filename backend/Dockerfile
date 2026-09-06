FROM python:3.11-slim

# Install system dependencies (LibreOffice, Pandoc, Calibre, ffmpeg)
RUN apt-get update && apt-get install -y \
    libreoffice \
    pandoc \
    calibre \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Ensure temp directories exist
RUN mkdir -p temp_out temp_uploads

# Start the FastAPI server (Render sets the PORT environment variable automatically)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
