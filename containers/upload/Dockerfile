FROM stemn/pipeline-base:latest as build
WORKDIR /app

COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

COPY tsconfig.json tsconfig.json
COPY src src
COPY scripts scripts
RUN yarn build:typescript || true

RUN yarn install --production

FROM stemn/pipeline-base:latest
WORKDIR /app

COPY --from=build /app /app
ENTRYPOINT cd /app && yarn start
