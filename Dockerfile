FROM node:24-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:24-alpine AS server-builder

WORKDIR /app/server
COPY server/package*.json server/package-lock.json ./
RUN npm install

COPY server/src ./src
COPY server/tsconfig.json server/tsconfig-build.json ./

RUN npx tsc -p tsconfig-build.json

FROM alpine:3.19

RUN apk add --no-cache ca-certificates nodejs

WORKDIR /app

COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules

ENV FILE_STORAGE_PATH=/file_store
ENV POSTGRES_HOST=db

EXPOSE 3000

CMD ["node", "--enable-source-maps", "server/dist/app.js"]
