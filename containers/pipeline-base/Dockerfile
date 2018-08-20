FROM node:10-alpine

ENV STEMN_PIPELINE_GID 4001
ENV STEMN_PIPELINE_GROUP pipeline
ENV STEMN_PIPELINE_UID 4001
ENV STEMN_PIPELINE_USER pipeline
ENV YARN_CACHE_PATH /.yarn-cache

RUN apk add --no-cache \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    gosu \
    tree

# make the environment directories
RUN mkdir $YARN_CACHE_PATH

RUN chown -R $STEMN_PIPELINE_UID:$STEMN_PIPELINE_GID $YARN_CACHE_PATH

RUN addgroup -g $STEMN_PIPELINE_GID $STEMN_PIPELINE_GROUP
RUN adduser -D -u $STEMN_PIPELINE_UID -G $STEMN_PIPELINE_GROUP $STEMN_PIPELINE_USER

RUN gosu $STEMN_PIPELINE_USER yarn config set cache-folder $YARN_CACHE_PATH
