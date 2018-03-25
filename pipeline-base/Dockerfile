FROM alpine:3.7

RUN apk add --no-cache \
    --repository http://dl-3.alpinelinux.org/alpine/edge/testing \
    gosu nodejs-current yarn

# make the yarn cache directory readable and writable to all
RUN mkdir /.cache && chown 666 /.cache
