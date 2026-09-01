# syntax=docker/dockerfile:1.4
# =============================================================================
# Multi-stage build: Hoà Nobita Frontend (React + Vite + nginx)
# =============================================================================
FROM --platform=linux/amd64 node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Relative path — nginx proxy sẽ forward /api/* sang backend
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM --platform=linux/amd64 nginx:1.27-alpine

# Install envsubst (gettext)
RUN apk add --no-cache gettext

COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

# Startup script: envsubst → start nginx
COPY <<'EOF' /docker-entrypoint.sh
#!/bin/sh
set -e
export BACKEND_URL=${BACKEND_URL:-http://localhost:8080}
export BACKEND_HOST=${BACKEND_URL#http://}
export BACKEND_HOST=${BACKEND_HOST#https://}
export BACKEND_HOST=${BACKEND_HOST%%/*}
envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
EOF
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

CMD ["/docker-entrypoint.sh"]
