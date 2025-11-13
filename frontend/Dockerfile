FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* /app/
# Use npm install instead of npm ci to avoid lockfile requirement in build env
RUN npm install --no-audit --no-fund && npm cache clean --force

COPY . /app
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
