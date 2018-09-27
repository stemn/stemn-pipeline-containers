FROM stemn/pipeline-base:latest
WORKDIR /app

ADD package.json package.json
ADD yarn.lock yarn.lock
RUN yarn install

ADD tsconfig.json tsconfig.json
ADD src src
ADD scripts scripts
RUN yarn build:typescript

RUN yarn install --production

ENTRYPOINT cd /app && yarn start
