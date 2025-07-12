# FROM node:alpine
FROM node:18-alpine
WORKDIR /app/just_halaa
RUN apk add --no-cache openssl

COPY package.json .

RUN npm install

COPY . .

RUN npm run migrate

EXPOSE 3001

CMD [ "npm", "run", "start" ]