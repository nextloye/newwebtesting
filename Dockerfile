FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 25569
ENV PORT=25569
ENV NODE_ENV=production
CMD ["node", "server.js"]
