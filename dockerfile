FROM node:20-bullseye-slim

WORKDIR /app

# pkill (procps) needed for killing old Next processes
RUN apt-get update \
  && apt-get install -y --no-install-recommends procps \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first for better layer cache
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

EXPOSE 3000

# Startup flow:
# 1) build project
# 2) kill old next processes (if any)
# 3) start with nohup + disown
# 4) tail log to keep container alive
CMD ["bash", "-lc", "set -e; set -m; echo '[1/4] Build project'; npm run build; echo '[2/4] Kill old Next.js process'; pkill -f 'next' || true; echo '[3/4] Start Next.js with nohup'; nohup npm run start > /app/nohup.out 2>&1 & disown || true; echo '[4/4] Follow logs'; tail -f /app/nohup.out"]