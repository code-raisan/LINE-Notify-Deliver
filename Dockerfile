FROM node:18.18.0-alpine3.18

WORKDIR /app

COPY . .

RUN touch data/subscribers.csv

RUN yarn install

RUN yarn build

CMD [ "node", "dist/main.js" ]
