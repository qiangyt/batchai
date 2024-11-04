FROM node:20.13.1

WORKDIR /opt/app
EXPOSE 4080

RUN npm config set https-proxy http://192.168.4.31:10081/
RUN npm config set proxy http://192.168.4.31:10081/

RUN npm install -g swc

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.build.json tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["npm", "run", "start:prod"]