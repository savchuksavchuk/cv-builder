FROM node:24-bookworm-slim AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY packages/cv-template packages/cv-template
RUN npm --prefix packages/cv-template ci
COPY ui/package*.json ui/
RUN npm --prefix ui ci
COPY ui ui
RUN npm --prefix ui run build

FROM nginx:alpine
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/ui/dist /usr/share/nginx/html
