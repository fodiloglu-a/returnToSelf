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

# Debug: Check what was built
RUN echo "Checking dist folder structure:" && \
    find /app/dist -type f -name "*.html" -o -name "*.js" -o -name "*.css" | head -20

# Production stage
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Try different copy paths based on Angular version
# For Angular 17+, try browser subfolder first
COPY --from=build /app/dist/return-to-self/browser /usr/share/nginx/html 2>/dev/null || \
COPY --from=build /app/dist/return-to-self /usr/share/nginx/html 2>/dev/null || \
COPY --from=build /app/dist /usr/share/nginx/html

# Debug: Check what was copied
RUN echo "Files in nginx html:" && ls -la /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
