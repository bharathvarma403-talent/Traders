require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => {
    console.log("Connected successfully to Render Postgres!");
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log(res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error("Connection error:", err.message);
    process.exit(1);
  });
