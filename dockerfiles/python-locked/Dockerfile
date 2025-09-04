FROM ubuntu:24.04

# Install Python and unzip
RUN apt update -y && \
    apt upgrade -y && \
    apt install -y software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa -y && \
    apt install -y unzip python3.13 python3.13-venv && \
    apt update -y && apt upgrade -y && apt clean && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.13 1

# Create a writable workspace
RUN mkdir -p /home/ubuntu/work && chown ubuntu:ubuntu /home/ubuntu/work
RUN mkdir -p /home/ubuntu/work/assignment && chown ubuntu:ubuntu /home/ubuntu/work/assignment


USER ubuntu
WORKDIR /home/ubuntu/work