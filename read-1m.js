const mysql = require('mysql2/promise');
const { performance } = require('perf_hooks');
const dbConfig = require('./db-config').dbConfig;
const cliProgress = require('cli-progress');

const TOTAL_ITERATIONS = 1000000;

(async () => {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Pick 5 random short_codes once
    const [shortCodes] = await connection.execute(`
      SELECT short_code FROM url_shortener ORDER BY RAND() LIMIT 5
    `);
    const codes = shortCodes.map((row) => row.short_code);

    console.log(`Running lookup for codes:`, codes);

    // Initialize progress bar
    const bar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    );
    bar.start(TOTAL_ITERATIONS, 0);

    const startTime = performance.now();

    for (let i = 1; i <= TOTAL_ITERATIONS; i++) {
      await connection.execute(
        `SELECT short_code, original_url FROM url_shortener WHERE short_code IN (?, ?, ?, ?, ?)`,
        codes
      );

      if (i % 100 === 0) bar.update(i);
    }

    bar.update(TOTAL_ITERATIONS);
    bar.stop();

    console.log(`✅ Completed ${TOTAL_ITERATIONS} iterations`);

    const endTime = performance.now();

    console.log(
      `⏱️ Total time for ${TOTAL_ITERATIONS} queries: ${
        (endTime - startTime) / 1000
      } seconds`
    );
  } catch (err) {
    console.error(`❌ Error during benchmark:`, err);
  } finally {
    await connection.end();
  }
})();
