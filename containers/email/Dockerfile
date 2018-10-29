FROM node:10-alpine AS build
WORKDIR /app

ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn install --ignore-engines

ADD tsconfig.json tsconfig.json
ADD src src
RUN yarn build:typescript

RUN yarn install --production --ignore-engines

FROM stemn/pipeline-base:latest
WORKDIR /app

COPY --from=build /app /app
ENTRYPOINT yarn start
