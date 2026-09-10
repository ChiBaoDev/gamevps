# Stage 1: Build Frontend
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Ultra-light Production Server (<70MB RAM)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=128"

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and backend scripts
COPY --from=builder /app/dist ./dist
COPY server ./server

# Persistent volume for SQLite database
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", "server/index.js"]
