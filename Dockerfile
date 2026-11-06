FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libasound2 \
    libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 \
    libgbm1 libcups2 libpango-1.0-0 libcairo2 libxshmfence1 \
    fonts-liberation ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
