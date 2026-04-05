# syntax=docker/dockerfile:experimental
FROM python:3.11-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DOCKER_BUILDKIT=1


# Create a new working dir in the image
WORKDIR /dokuly_image

# Install all system dependencies in a single layer
RUN apt-get update \
&& apt-get install -y --no-install-recommends \
    zlib1g-dev \
    python3-lxml \
    libffi-dev \
    libxml2-dev \
    libxslt1-dev \
    libpq-dev \
    python3-dev \
    libssl-dev \
    libjpeg-dev \
    curl \
    git \
    gcc \
    g++ \
    nodejs \
    npm \
    poppler-utils \
    wget \
&& rm -rf /var/lib/apt/lists/*

# Necessary installation for gerber SVG generation.
# Consider separating out gerber rendering to a micro-service.
RUN npm install -g @tracespace/cli

COPY ./requirements.txt /dokuly_image/requirements.txt

# Install requirements. Passing SSH-keys for github access to the container.
RUN pip3 install --no-cache-dir --upgrade pip && pip3 install --no-cache-dir -r requirements.txt

COPY . /dokuly_image

RUN rm -rf /root/.ssh/

EXPOSE 80 2222

# Use the entrypoint shell script as cmd
CMD /dokuly_image/startup.sh
