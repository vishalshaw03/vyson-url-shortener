const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cliProgress = require('cli-progress');
const dbConfig = require('./db-config').dbConfig;
require('dotenv').config();

const TOTAL_RECORDS = 1_000_000;
const BATCH_SIZE = 1000;

// Generate short code
function generateShortCode(url) {
  return crypto
    .createHash('sha256')
    .update(url + Date.now())
    .digest('base64') // URL-unfriendly chars
    .replace(/[+/=]/g, '') // Remove non-URL-safe
    .slice(0, 12);
}

(async () => {
  const connection = await mysql.createConnection(dbConfig);

  console.time('InsertTime');

  // Create and start progress bar
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(TOTAL_RECORDS, 0);

  for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
    const values = [];

    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_RECORDS; j++) {
      const urlIndex = i + j + 1;
      const longUrl = `https://example.com/resource/${urlIndex}`;
      const shortCode = generateShortCode(longUrl);
      values.push([longUrl, shortCode]);
    }

    const sql = `
      INSERT IGNORE INTO url_shortener (original_url, short_code)
      VALUES ?
    `;

    try {
      await connection.query(sql, [values]);
    } catch (err) {
      console.error('Error during insert:', err.message);
    }

    bar.update(i + values.length);
  }

  bar.stop();
  console.timeEnd('InsertTime');
  await connection.end();
})();
