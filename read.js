const mysql = require('mysql2/promise');
const { performance } = require('perf_hooks');
const dbConfig = require('./db-config').dbConfig;

(async () => {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Step 1: Pick 5 random short codes
    const [shortCodes] = await connection.execute(`
      SELECT short_code FROM url_shortener ORDER BY RAND() LIMIT 5
    `);
    const codes = shortCodes.map(row => row.short_code);

    console.log(`🔍 Fetching URLs for short_codes:`, codes);

    // Step 2: Time the query
    const startTime = performance.now();

    const [results] = await connection.execute(
      `SELECT short_code, original_url FROM url_shortener WHERE short_code IN (?, ?, ?, ?, ?)`,
      codes
    );

    const endTime = performance.now();

    // Step 3: Log results
    console.log(`📝 Results:`);
    results.forEach(row => {
      console.log(`${row.short_code} ➜ ${row.original_url}`);
    });

    console.log(`⏱️ Query took ${(endTime - startTime).toFixed(2)} ms`);

  } catch (err) {
    console.error(`❌ Error:`, err);
  } finally {
    await connection.end();
  }
})();
