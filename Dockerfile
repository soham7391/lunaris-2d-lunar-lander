# -------------------------------------------------------------
# Stage 1: Build Application
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install project dependencies
RUN npm install

# Copy application source code
COPY . .

# Compile TypeScript and build production bundle
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Web Server
# -------------------------------------------------------------
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Apply production Nginx configuration with SPA routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist ./

# Expose standard HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
