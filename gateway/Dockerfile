FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY session_manager.py .
COPY static/ ./static/

# Use gevent worker for WebSocket support
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--worker-class", "gevent", "-w", "1", "app:app"]
