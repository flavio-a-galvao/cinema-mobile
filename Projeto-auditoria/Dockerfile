FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY subscriber.js store.js ./
RUN mkdir /data && chown node:node /data
USER node
ENV AUDIT_DB_PATH=/data/audit.sqlite
CMD ["node", "subscriber.js"]
