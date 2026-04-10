ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js 20
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Install all deps (including devDependencies for build)
COPY server/package.json server/package-lock.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY server/tsconfig.json ./
COPY server/src/ ./src/
RUN npx tsc

# Remove devDependencies after build
RUN npm prune --omit=dev

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 3456

CMD ["/run.sh"]
