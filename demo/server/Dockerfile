FROM node:22.9.0

WORKDIR /opt/app
EXPOSE 4080

RUN apt-get -yy update
RUN apt-get -yy install ncat

RUN npm config set https-proxy http://192.168.4.31:10081/
RUN npm config set proxy http://192.168.4.31:10081/

RUN npm install -g swc

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.build.json tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["npm", "run", "start:prod"]