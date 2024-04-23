# Clone the project
FROM alpine/git as git

ARG REPOSITORY=https://github.com/buggregator/frontend
ARG BRANCH=master
RUN git clone -b $BRANCH $REPOSITORY /app

# Build JS files
FROM node:21-alpine as frontend
COPY --from=git /app /app
WORKDIR /app

ARG APP_VERSION=1.0.0
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV VITE_APP_MODE=production

RUN sed -i "s/\"version\": \".*\"/\"version\": \"${APP_VERSION}\"/" package.json

RUN npm install --ignore-scripts
RUN npm run generate
RUN rm -rf node_modules

LABEL org.opencontainers.image.source=$REPOSITORY
LABEL org.opencontainers.image.description="Buggregator Frontend"
LABEL org.opencontainers.image.licenses=MIT
