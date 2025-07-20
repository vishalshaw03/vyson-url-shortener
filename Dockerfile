FROM node:18

WORKDIR /usr/src/app

# Copy only necessary files
COPY package*.json ./
COPY .env ./
COPY db.js .
COPY app.js .

RUN npm install

EXPOSE 5000

CMD [ "npm", "start" ]
