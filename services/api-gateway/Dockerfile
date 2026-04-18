# Build stage 
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install

# Production stage 
FROM node:18-alpine
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY . .

USER nodejs
EXPOSE 8000
CMD ["node", "src/index.js"]