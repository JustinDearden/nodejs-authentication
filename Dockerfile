FROM node:14-alpine
WORKDIR /app

# Create logs directory so that Winston can write logs
RUN mkdir -p logs

# Copy dependency definitions
COPY package*.json ./
RUN npm install

# Copy the rest of the application code.
COPY . .

EXPOSE 3000
CMD ["npm", "start"]