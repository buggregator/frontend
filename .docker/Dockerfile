# Clone the project
FROM alpine/git as git

ARG REPOSITORY=https://github.com/buggregator/frontend
ARG BRANCH=master
RUN git clone -b $BRANCH $REPOSITORY /app

# Build JS files
FROM node:19-alpine as frontend
COPY --from=git /app /app
WORKDIR /app

ENV NODE_OPTIONS=--openssl-legacy-provider

RUN yarn install
RUN npm run generate
RUN rm -rf node_modules

LABEL org.opencontainers.image.source=$REPOSITORY
LABEL org.opencontainers.image.description="Buggregator Frontend"
LABEL org.opencontainers.image.licenses=MIT
