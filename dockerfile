# =========================
# 1. Build Frontend (Next.js)
# =========================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# =========================
# 2. Build Backend (FastAPI)
# =========================
FROM python:3.11-slim AS backend-builder

WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# =========================
# 3. Final Image
# =========================
FROM python:3.11-slim

# Cài Node để chạy Next.js
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend /app/backend

# Copy frontend đã build
COPY --from=frontend-builder /app/frontend /app/frontend

# Copy script start
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 8000

CMD ["/start.sh"]