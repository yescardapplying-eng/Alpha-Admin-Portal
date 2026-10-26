# ==============================================================================
# RENDER PRODUCTION DOCKERFILE — STOCK MARKET ADMIN PORTAL (PHP + MYSQL)
# ==============================================================================
FROM php:8.3-cli-alpine

# Install PDO MySQL extension and CA certificates
RUN docker-php-ext-install pdo pdo_mysql mysqli \
    && apk add --no-cache ca-certificates

# Set working directory
WORKDIR /var/www/html

# Copy all application files
COPY . /var/www/html

# Environment default port (Render will inject $PORT dynamically)
ENV PORT=10000
EXPOSE 10000

# Start PHP built-in server with router
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} router.php"]
