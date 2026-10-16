FROM python:3.13-slim

WORKDIR /app

# Install system dependencies needed for compiler utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install pinned requirements sheets
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your application source code tree layer bounds
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
