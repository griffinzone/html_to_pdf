# Use Node.js 18 slim - lighter than full but works better with Puppeteer than alpine
FROM node:18-slim

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Remove dev dependencies to reduce image size
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Set environment variable for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Cloud Run will set PORT automatically, but default to 8090 for local testing
ENV PORT=8090

# Expose port
EXPOSE 8090

# Start the server
CMD ["node", "dist/server.js"]

