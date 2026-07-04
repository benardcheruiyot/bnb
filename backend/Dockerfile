FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY src ./src

EXPOSE 5004

CMD ["node", "src/server.js"]
