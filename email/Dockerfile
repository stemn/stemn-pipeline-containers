FROM stemn/pipeline-base:latest

WORKDIR /app

ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn

ADD src src

ENTRYPOINT yarn start
