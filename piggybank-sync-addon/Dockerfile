ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js and native build tools (needed for better-sqlite3)
RUN apk add --no-cache nodejs npm python3 make g++

WORKDIR /app

# Install all deps (including devDependencies for build)
COPY server/package.json server/package-lock.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY server/tsconfig.json ./
COPY server/src/ ./src/
RUN npx tsc

# Remove devDependencies and build tools to slim the image
RUN npm prune --omit=dev && apk del python3 make g++

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 3456

CMD ["/run.sh"]
