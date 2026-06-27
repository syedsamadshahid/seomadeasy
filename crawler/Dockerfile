FROM mcr.microsoft.com/playwright:v1.48.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Cloud Run listens on PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/index.js"]
