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

CMD ["/app/docker/entrypoint.sh"]