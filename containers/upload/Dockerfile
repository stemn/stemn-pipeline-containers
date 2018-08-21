FROM node:10-alpine AS build

WORKDIR /app
ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn install

ADD tsconfig.json tsconfig.json
ADD src src
RUN yarn build:typescript

RUN yarn install --production

FROM stemn/pipeline-base:latest
COPY --from=build /app /app
WORKDIR /app
ENTRYPOINT yarn start
