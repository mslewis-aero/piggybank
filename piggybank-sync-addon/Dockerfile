ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.21

# Build stage: compile TypeScript and native modules with pinned Node 20
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src/ ./src/
RUN npx tsc
RUN npm prune --omit=dev

# Runtime stage: HA base image with just Node and compiled artifacts
FROM ${BUILD_FROM}

RUN apk add --no-cache libstdc++

# Copy Node.js binary from the builder (pinned at Node 20)
COPY --from=builder /usr/local/bin/node /usr/local/bin/node

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 3456

CMD ["/run.sh"]
