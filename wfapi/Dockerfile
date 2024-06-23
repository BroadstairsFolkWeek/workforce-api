FROM node:lts-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .


FROM base as builder
WORKDIR /usr/src/app
RUN npm run build
RUN npm run test


FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /usr/src/app/dist/src ./
RUN chown -R node /usr/src/app
USER node
EXPOSE 3000
ENTRYPOINT ["node","./index.js"]
