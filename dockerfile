FROM node:20-bullseye-slim

WORKDIR /app

# procps: tiện debug; ca-certificates: HTTPS khi npm
RUN apt-get update \
  && apt-get install -y --no-install-recommends procps ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pm2@latest

ENV NODE_ENV=production
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy file cấu hình phụ thuộc trước để tận dụng layer cache
COPY package.json package-lock.json* ./
COPY ecosystem.config.cjs ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
  && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/logs \
  && npm i \
  && (npm audit fix || true)

# Source code (build chạy lại trong entrypoint khi container start/redeploy)
COPY . .
RUN mkdir -p /app/logs \
  && sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
