FROM criyle/go-judge:latest

RUN apt-get update && \
    apt-get install -y \
        gcc \
        g++ \
        libc6-dev \
        python3 \
    && rm -rf /var/lib/apt/lists/*

ENV PATH=/usr/bin:/bin:/usr/local/bin

WORKDIR /opt

EXPOSE 5050 5051 5052

ENTRYPOINT ["./go-judge"]
