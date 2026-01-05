FROM ubuntu:24.04
RUN apt update
RUN apt upgrade -y
RUN apt install -y software-properties-common
RUN apt install unzip -y
RUN apt install openjdk-25-jdk -y
RUN apt install -y python3
RUN apt update -y && apt upgrade -y && apt clean && rm -rf /var/lib/apt/lists/*


# Create a writable workspace
RUN mkdir -p /home/ubuntu/work && chown ubuntu:ubuntu /home/ubuntu/work
RUN mkdir -p /home/ubuntu/work/assignment && chown ubuntu:ubuntu /home/ubuntu/work/assignment


USER ubuntu
WORKDIR /home/ubuntu/work

RUN which java
RUN which javac
RUN which python3

