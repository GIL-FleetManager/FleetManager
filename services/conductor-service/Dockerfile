FROM dunglas/frankenphp:1-php8.4-alpine AS builder

WORKDIR /app

RUN install-php-extensions pdo_pgsql intl zip opcache rdkafka

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./

RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer install --no-dev --optimize-autoloader --no-scripts

FROM dunglas/frankenphp:1-php8.4-alpine

WORKDIR /app

RUN apk add --no-cache curl \
    && install-php-extensions pdo_pgsql intl zip opcache rdkafka

COPY --from=builder /app /app

RUN mkdir -p /app/var && chown -R www-data:www-data /app/var

RUN chown -R www-data:www-data /app/src /app/config

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -s http://localhost:80/ > /dev/null || exit 1

ENV APP_ENV=dev
ENV APP_DEBUG=1

EXPOSE 80
CMD ["frankenphp", "php-server", "--root", "/app/public"]