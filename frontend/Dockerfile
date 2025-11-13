FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* /app/
RUN npm ci && npm cache clean --force

COPY . /app
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
