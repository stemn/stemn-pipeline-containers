FROM dcowden/cadquery

USER root

RUN apt-get update \
    && apt-get install -y gosu \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -M --user-group pipeline

WORKDIR /pipeline
