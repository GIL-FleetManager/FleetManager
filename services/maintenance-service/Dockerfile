# --- Stage 1: Build
FROM dunglas/frankenphp:1-php8.4-alpine AS builder

WORKDIR /app

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .

# Autoloader
RUN composer install --no-dev --optimize-autoloader

# --- Stage 2: Runtime 
FROM dunglas/frankenphp:1-php8.4-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app /app

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -s http://localhost:80/ > /dev/null || exit 1

ENV APP_ENV=prod
ENV APP_DEBUG=0

EXPOSE 80
EXPOSE 443
EXPOSE 443/udp

CMD ["frankenphp", "php-server"]