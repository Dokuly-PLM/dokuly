# syntax=docker/dockerfile:experimental
FROM python:3.11.1-slim-buster
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DOCKER_BUILDKIT=1


# Create a new working dir in the image
WORKDIR /dokuly_image

# Copy over the python pdf package to sdp folder
# COPY ./NdPdfEditor/* ./NdPdfEditor

# Dependencies required on Mac M1.
RUN apt-get update \
&& apt-get install -y \
    zlib1g-dev \
    python3-lxml \
    libffi-dev \
    libxml2-dev \
    libxslt1-dev \
    python-dev \
    libpq-dev \
    python3-dev \
    libssl-dev \
    libjpeg-dev zlib1g-dev \
    libpq-dev \
    curl \
    git \
    gcc \
    g++ \
    nodejs \
    npm

# Necessary installation for gerber SVG generation.
# Consider separating out gerber rendering to a micro-service.
RUN npm install -g @tracespace/cli
# RUN npm install -g @tracespace/cli@next

COPY ./requirements.txt /dokuly_image/requirements.txt

# Install requirements. Passing SSH-keys for github access to the container.
RUN pip3 install --upgrade pip && pip3 install -r requirements.txt

COPY . /dokuly_image

RUN rm -rf /root/.ssh/

# Install wget
RUN  apt-get update \
    && apt-get install -y wget \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 80 2222

# Use the entrypoint shell script as cmd
CMD /dokuly_image/startup.sh

