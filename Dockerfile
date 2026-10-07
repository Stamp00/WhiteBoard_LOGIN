FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    CHECKPOINT_DISABLE=1

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Kör som icke-root (krävs t.ex. på CSC Rahti / OpenShift)
RUN chown -R node:node /app
USER node

ENV PORT=3001
EXPOSE 3001

# Kör databasmigreringar och starta servern
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node src/server.js"]
