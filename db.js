const mysql = require('mysql2');
require('dotenv').config();

const MAX_RETRIES = 10;
const RETRY_INTERVAL = 2000; // 2 seconds

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let connection;
let isConnected = false;
let connectCallbacks = [];

function connectWithRetry(retriesLeft = MAX_RETRIES) {
  console.log(`⏳ Attempting DB connection... Retries left: ${retriesLeft}`);
  connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    if (err) {
      console.error(`❌ DB connection failed: ${err.message}`);
      if (retriesLeft > 0) {
        setTimeout(() => connectWithRetry(retriesLeft - 1), RETRY_INTERVAL);
      } else {
        console.error('🚫 Max retries reached. Exiting.');
        process.exit(1);
      }
    } else {
      isConnected = true;
      console.log('✅ MySQL connected!');
      connectCallbacks.forEach(cb => cb(connection));
    }
  });
}

setTimeout(() => connectWithRetry(), 2000);

module.exports = {
  getConnection: (cb) => {
    if (isConnected) {
      cb(connection);
    } else {
      connectCallbacks.push(cb);
    }
  }
};
