FROM stemn/pipeline-base:latest as build
WORKDIR /app

ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn install

ADD tsconfig.json tsconfig.json
ADD src src
ADD scripts scripts
RUN yarn build:typescript || true

RUN yarn install --production

FROM stemn/pipeline-base:latest
WORKDIR /app

COPY --from=build /app /app

ENTRYPOINT cd /app && yarn start
