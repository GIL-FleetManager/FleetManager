# Stage 1: Build
FROM golang:1.26-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compile static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd

# Stage 2: Runtime
FROM alpine:3.18

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/main .

# Security: Create and switch to non-root user
RUN adduser -D appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["./main"]