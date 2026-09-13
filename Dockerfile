FROM python:3.13-slim

# MediaPipe's and OpenCV's native bindings dlopen system graphics libraries
# (GL/GLES/EGL) even in headless, CPU-only, server-side use. Render's plain
# Python runtime doesn't have these and offers no way to apt-get them, so a
# Docker image is required to supply them.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgles2 \
    libegl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 10000
CMD gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --worker-class gthread --threads 4 --timeout 120
