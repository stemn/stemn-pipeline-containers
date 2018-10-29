FROM node:10-alpine AS build
WORKDIR /app

COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install --ignore-engines

COPY tsconfig.json tsconfig.json
COPY src src
RUN yarn build:typescript

RUN yarn install --production --ignore-engines

FROM stemn/pipeline-base:latest
WORKDIR /app

COPY --from=build /app /app
ENTRYPOINT yarn start
