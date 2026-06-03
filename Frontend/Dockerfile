# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=1536

COPY package*.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

COPY . .

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN --mount=type=cache,target=/app/node_modules/.vite \
    npm run build:docker

FROM nginx:1.27-alpine AS runner

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
