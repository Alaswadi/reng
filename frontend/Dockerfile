FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* /app/
RUN npm install --omit=dev && npm cache clean --force

COPY . /app

EXPOSE 3000
CMD ["npm", "run", "dev"]

