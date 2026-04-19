
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./

RUN if [ -f yarn.lock ]; then corepack enable yarn && yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; fi

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* yarn.lock* ./
RUN if [ -f yarn.lock ]; then corepack enable yarn && yarn install --frozen-lockfile --production; \
  elif [ -f package-lock.json ]; then npm ci --omit=dev; \
  else npm install --omit=dev; fi

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/results
VOLUME ["/app/results"]


CMD ["node", "dist/src/main.js"]
