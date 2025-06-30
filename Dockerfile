# Single stage build (simpler but larger image)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and Angular CLI
RUN npm ci && npm install -g @angular/cli

# Copy source code
COPY . .

# Build the application
RUN ng build --configuration production

# Install nginx
RUN apk add --no-cache nginx

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx directories
RUN mkdir -p /var/log/nginx /var/lib/nginx/tmp

# Copy built files to nginx
RUN cp -r dist/return-to-self/* /usr/share/nginx/html/ 2>/dev/null || \
    cp -r dist/* /usr/share/nginx/html/ 2>/dev/null || \
    echo "Build files not found in expected location"

# Show what we have
RUN ls -la /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
