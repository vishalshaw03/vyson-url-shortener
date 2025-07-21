const mysql = require('mysql2');
const dbConfig = require('./db-config').dbConfig;

const MAX_RETRIES = 10;
const RETRY_INTERVAL = 2000; // 2 seconds

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
      connectCallbacks.forEach((cb) => cb(connection));
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
