# --- Stage 1: Builder ---
FROM dunglas/frankenphp:1-php8.4-alpine AS builder

WORKDIR /app

# Install system dependencies and PHP extensions
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql intl zip opcache rdkafka

# Copy composer files first for better caching
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./

# Preliminary install
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy the rest of the application
COPY . .

# CRITICAL: Verify the config exists
RUN ls -la config/routes/api_platform.yaml || (echo "ERROR: api_platform.yaml missing!" && exit 1)

# Final composer optimization
RUN composer install --no-dev --optimize-autoloader --no-scripts

# --- Stage 2: Final Runtime ---
FROM dunglas/frankenphp:1-php8.4-alpine

WORKDIR /app

# Repeat extension installation for the final runtime stage
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN apk add --no-cache curl \
    && install-php-extensions pdo_pgsql intl zip opcache rdkafka

# Copy the built application
COPY --from=builder /app /app

# FIX: Create /app/var before changing permissions to avoid build errors
RUN mkdir -p /app/var && \
    chown -R www-data:www-data /app/var /app/config /app/src /app/public

# Environment variables
ENV APP_ENV=dev
ENV APP_DEBUG=1
ENV FRANKENPHP_CONFIG="worker ./public/index.php"

EXPOSE 80
CMD ["frankenphp", "php-server", "--root", "public/"]