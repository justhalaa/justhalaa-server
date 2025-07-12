# FROM node:alpine
FROM node:18-alpine
WORKDIR /app/just_halaa
RUN apk add --no-cache openssl

COPY package.json .

RUN yarn install

COPY . .

EXPOSE 3001

CMD [ "yarn", "run", "start" ]