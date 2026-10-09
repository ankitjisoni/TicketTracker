# Build and runtime container for TicketTracker
FROM node:20-alpine AS runner

WORKDIR /app

# Install native build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

ENV PORT=3000 \
    POLL_INTERVAL_MS=30000

CMD ["node", "server.js"]
