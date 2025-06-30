# Multi-stage build for Angular application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the Angular application
RUN npm run build -- --configuration production

# Debug: Show build output
RUN echo "=== Checking build output ===" && \
    find /app -name "index.html" -type f && \
    ls -la /app/dist/ && \
    ls -la /app/dist/*/ 2>/dev/null || true

# Production stage
FROM nginx:alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy all possible build outputs and set proper permissions
COPY --from=build /app/dist /tmp/dist
RUN if [ -d "/tmp/dist/return-to-self/browser" ]; then \
        cp -r /tmp/dist/return-to-self/browser/* /usr/share/nginx/html/; \
    elif [ -d "/tmp/dist/return-to-self" ]; then \
        cp -r /tmp/dist/return-to-self/* /usr/share/nginx/html/; \
    else \
        cp -r /tmp/dist/* /usr/share/nginx/html/; \
    fi && \
    rm -rf /tmp/dist

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Verify files and permissions
RUN echo "=== Final check ===" && \
    ls -la /usr/share/nginx/html/ && \
    echo "=== Index.html exists? ===" && \
    test -f /usr/share/nginx/html/index.html && echo "YES" || echo "NO"

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Test nginx config
RUN nginx -t

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
