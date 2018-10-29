FROM dcowden/cadquery
WORKDIR /pipeline

USER root

# make the cq user uid and gid the same as the pipeline user
RUN sed -i 's/1000:1000/4001:4001/' /etc/passwd
RUN sed -i 's/1000/4001/' /etc/group

USER cq
