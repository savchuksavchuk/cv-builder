FROM node:24-bookworm-slim AS build
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app
COPY packages/cv-template/package*.json packages/cv-template/
RUN npm --prefix packages/cv-template ci
COPY api/package*.json api/
COPY packages/cv-template packages/cv-template
RUN npm --prefix api ci --ignore-scripts
COPY api api
RUN npm --prefix api run build && npm --prefix api prune --omit=dev

FROM node:24-bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium PUPPETEER_NO_SANDBOX=true
WORKDIR /app
COPY --from=build /app/packages/cv-template/package.json packages/cv-template/package.json
COPY --from=build /app/packages/cv-template/dist packages/cv-template/dist
COPY --from=build /app/api/package.json api/package.json
COPY --from=build /app/api/node_modules api/node_modules
COPY --from=build /app/api/dist api/dist
WORKDIR /app/api
CMD ["node", "dist/main"]
