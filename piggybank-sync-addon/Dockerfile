ARG BUILD_FROM=node:20-alpine
FROM ${BUILD_FROM}

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/dist/ ./dist/

COPY run.sh /run.sh
RUN chmod a+x /run.sh

EXPOSE 3456

CMD ["/run.sh"]
