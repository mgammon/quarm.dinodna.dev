FROM node:20.9-alpine

RUN mkdir -p /app

WORKDIR /app

ENV NODE_ENV development

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start:dev"]