FROM node:14.17.6-slim

RUN apt-get update -y && apt-get install -y git

RUN mkdir /opt/glue_ops
WORKDIR /opt/glue_ops

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm link
