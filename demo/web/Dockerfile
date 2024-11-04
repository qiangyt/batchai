# 1. stage: build
FROM node:20.13.1 as builder

WORKDIR /workspace

RUN npm config set https-proxy http://192.168.4.31:10081/
RUN npm config set proxy http://192.168.4.31:10081/
COPY package.json package-lock.json ./
RUN npm install

COPY components.json next-env.d.ts next.config.mjs postcss.config.mjs tailwind.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm run build

# 2. stage: runtime ------------------------------------------------------------
FROM nginx:1.27.0

WORKDIR /opt/app
EXPOSE 8443

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /workspace/out /opt/app/
