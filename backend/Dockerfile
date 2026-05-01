FROM node:20-alpine

# Install Chromium for Puppeteer (PDF generation)
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      npm

# Set environment variable for Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

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

# Start script
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
