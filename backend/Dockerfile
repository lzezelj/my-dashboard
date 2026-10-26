FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma7.config.ts tsconfig.json ./
COPY src ./src
RUN DATABASE_URL=postgresql://build:build@localhost/build npx prisma generate --config prisma7.config.ts
RUN npm run build

FROM build AS migrate
USER node
CMD ["npx", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"]

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/app.js"]
