FROM alpine

COPY requirements.txt /usr/src/

# Installing db-client

RUN apk add --virtual build-deps \
	build-deps python3-dev build-base linux-headers \
	mariadb-dev musl-dev libxml2-dev openssh libxslt-dev libffi-dev libxslt


RUN apk add --no-cache \
    python3 \
    pcre-dev \
    libxml2 \
    mariadb-client \
    mariadb-dev \
    bash && \
    python3 -m ensurepip && \
    rm -r /usr/lib/python*/ensurepip && \
    pip3 install --upgrade pip setuptools && \
    pip3 install -r /usr/src/requirements.txt && \
    rm -r /root/.cache


RUN apk del build-deps
