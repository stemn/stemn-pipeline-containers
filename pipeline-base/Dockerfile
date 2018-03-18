FROM alpine:3.7

RUN apk add --no-cache \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    gosu nodejs-current yarn

RUN addgroup pipeline && adduser -S -G pipeline pipeline
