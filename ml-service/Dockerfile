FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir \
    transformers==4.41.2 \
    datasets==2.19.1 \
    scikit-learn==1.5.0 \
    mlflow==2.11.3 \
    fastapi==0.111.0 \
    "uvicorn[standard]==0.30.1" \
    pydantic==2.7.1 \
    numpy==1.26.4 \
    pandas==2.2.2 \
    accelerate==0.30.0 \
    python-multipart==0.0.9 \
    httpx==0.27.0 \
    h11

COPY app.py .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]