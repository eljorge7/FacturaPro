FROM node:20-bookworm-slim

# Install Chromium for Puppeteer and OpenSSL for Prisma
RUN apt-get update && apt-get install -y \
    chromium \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable for Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build the NestJS app
RUN npm run build

# Ensure uploads directory exists and has correct permissions
RUN mkdir -p uploads && chown -R node:node uploads

# Expose backend port
EXPOSE 4000

# Start script (using db push since we don't use migrations folder)
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm run start:prod"]
