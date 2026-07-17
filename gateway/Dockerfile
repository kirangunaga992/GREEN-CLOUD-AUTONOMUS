FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    GATEWAY_PORT=5001

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY session_manager.py .
COPY static/ ./static/

EXPOSE 5001

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')"

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "1", "--threads", "8", "--timeout", "60", "app:app"]
