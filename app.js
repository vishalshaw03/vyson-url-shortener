const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const { filesize } = require('filesize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;
const DB_NAME = process.env.DB_NAME;
const TABLE_NAME = 'url_shortener';

const ibdPath = path.join(
  process.env.MYSQL_DATA_DIR,
  DB_NAME,
  `${TABLE_NAME}.ibd`
);

const CODE_LENGTH = 12; // Length of the short code
const retries = 5; // Number of retries for generating unique short codes

app.use(express.json());

// Generate short code
function generateShortCode() {
  return crypto.randomBytes(CODE_LENGTH / 2).toString('hex'); // 12-char code
}

const getConnection = async () => {
  return new Promise((resolve, reject) => {
    db.getConnection((connection) => {
      if (!connection) {
        return reject(new Error('Failed to connect to the database'));
      }
      resolve(connection);
    });
  });
};

// POST /shorten => Create short URL
app.post('/shorten', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  try {
    for (let i = 0; i < retries; i++) {
      const short_code = generateShortCode();

      const query = `INSERT INTO ${TABLE_NAME} (original_url, short_code) VALUES (?, ?)`;

      const conn = await getConnection();
      const db = conn.promise();

      try {
        await db.query(query, [url, short_code]);
        res.json({ short_url: `${BASE_URL}/d/${short_code}` });
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') continue; // try again with a new short_code
        throw err;
      }
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res
        .status(409)
        .json({ error: 'Duplicate short code. Try again.' });
    }
    return res
      .status(500)
      .json({ error: 'Database error', details: err.message });
  }
});

// GET /u/:short_code => Get original URL
app.get('/u/:short_code', async (req, res) => {
  const { short_code } = req.params;

  if (!short_code) {
    return res.status(400).json({ error: 'Short code is required' });
  }

  const query = `SELECT original_url FROM ${TABLE_NAME} WHERE short_code = ?`;

  const conn = await getConnection();
  const db = conn.promise();

  try {
    const results = await db.query(query, [short_code]);

    if (results[0].length === 0) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const originalUrl = results[0][0].original_url;
    res.json({ url: originalUrl });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// GET /d/:short_code => Redirect to original URL
app.get('/d/:short_code', async (req, res) => {
  const { short_code } = req.params;

  if (!short_code) {
    return res.status(400).send('Short code is required');
  }

  const query = `SELECT original_url FROM ${TABLE_NAME} WHERE short_code = ?`;

  const conn = await getConnection();
  const db = conn.promise();

  try {
    const [results] = await db.query(query, [short_code]);

    if (results.length === 0) {
      return res.status(404).send('Short URL not found');
    }

    const originalUrl = results[0].original_url;

    // Do a proper HTTP 302 redirect
    res.redirect(originalUrl);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// GET /disk-usage
app.get('/disk-usage', async (_, res) => {
  try {
    const stats = fs.statSync(ibdPath);

    const conn = await getConnection();
    const db = conn.promise();

    // Get row count
    const [rows] = await db.query(
      'SELECT COUNT(*) AS count FROM url_shortener'
    );

    const rowCount = rows[0].count;

    res.json({
      size: filesize(stats.size),
      row_count: rowCount
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to get disk usage or row count',
      details: err.message
    });
  }
});

app.get('/', (_, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <h1>URL Shortener API</h1>
    <p>Use the endpoints:</p>
    <ul>
      <li><strong>POST /shorten</strong> - Create a short URL</li>
      <li><strong>GET /u/:short_code</strong> - Get original URL</li>
      <li><strong>GET /d/:short_code</strong> - Redirect to original URL</li>
      <li><strong>GET /disk-usage</strong> - Get disk usage and row count</li>
    </ul>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
