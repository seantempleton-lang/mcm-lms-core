FROM node:20-slim

WORKDIR /app

# Install OpenSSL (required by Prisma query engine)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Prisma schema + generate client
COPY prisma ./prisma
RUN npx prisma generate

# Application source
COPY src ./src
COPY docker ./docker

RUN chmod +x ./docker/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["/app/docker/entrypoint.sh"]
