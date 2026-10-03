FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 5000

# run as the non-root "node" user that ships with the image
USER node
CMD ["node", "src/server.js"]
