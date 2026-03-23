<<<<<<< HEAD
# --- Étape 1 : Build (Installation des dépendances) ---
FROM php:8.2-fpm-alpine AS app_builder

WORKDIR /var/www/html

# Installation des extensions PHP nécessaires pour Symfony & Postgres
RUN apk add --no-cache \
    icu-dev \
    libpq-dev \
    && docker-php-ext-install \
    intl \
    pdo \
    pdo_pgsql

# Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copie des fichiers de dépendances
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

# Copie du reste du code
COPY . .
RUN composer dump-autoloader --optimize --classmap-authoritative

# --- Étape 2 : Runtime (L'image finale) ---
FROM php:8.2-fpm-alpine AS app_runtime

WORKDIR /var/www/html

# On récupère uniquement ce dont on a besoin depuis l'étape de build
COPY --from=app_builder /var/www/html /var/www/html

# On remet les extensions nécessaires pour l'exécution
RUN apk add --no-cache libpq

# Optimisation pour la prod
ENV APP_ENV=prod
ENV APP_DEBUG=0

EXPOSE 9000
CMD ["php-fpm"]
=======
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
>>>>>>> origin/main
