FROM stemn/pipeline-base:latest

WORKDIR /app

RUN apk add --update git nodejs nodejs-npm

ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn

ADD dist dist

ENTRYPOINT yarn start
