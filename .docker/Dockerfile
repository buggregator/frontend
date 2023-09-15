# Clone the project
FROM alpine/git as git

ARG REPOSITORY=https://github.com/buggregator/frontend
ARG BRANCH=master
RUN git clone -b $BRANCH $REPOSITORY /app
ARG APP_VERSION=1.0.0

# Build JS files
FROM node:19-alpine as frontend
COPY --from=git /app /app
WORKDIR /app

ENV NODE_OPTIONS=--openssl-legacy-provider

RUN sed -i 's/"version": "0.0.1"/"version": "${APP_VERSION}"/g' "package.json"
RUN npm install
RUN npm run generate
RUN rm -rf node_modules

LABEL org.opencontainers.image.source=$REPOSITORY
LABEL org.opencontainers.image.description="Buggregator Frontend"
LABEL org.opencontainers.image.licenses=MIT
