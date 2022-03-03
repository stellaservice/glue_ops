FROM node:14.17.6-slim

RUN mkdir /opt/glue_ops
WORKDIR /opt/glue_ops

COPY package.json yarn.lock ./

RUN yarn

COPY . .

RUN yarn link
