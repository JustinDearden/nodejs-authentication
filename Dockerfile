FROM node:18-slim
WORKDIR /app

RUN mkdir -p logs

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]