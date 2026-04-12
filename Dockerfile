FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
COPY docker ./docker
RUN chmod +x ./docker/entrypoint.sh
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["/app/docker/entrypoint.sh"]
