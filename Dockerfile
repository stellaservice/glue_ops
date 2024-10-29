FROM node:20.8.0-slim

RUN apt-get update -y \
  && apt-get install -y git curl jq

RUN mkdir /opt/glue_ops
WORKDIR /opt/glue_ops

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm link
