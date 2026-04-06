const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://vasavi_db_0rwf_user:SfU25qMfQoWUTbwaaZTRrDev5oLBdiFc@dpg-d6t8v9fgi27c73dhale0-a.oregon-postgres.render.com/vasavi_db_0rwf',
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
