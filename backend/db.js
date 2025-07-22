const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // Your PostgreSQL username
  host: 'localhost',
  database: 'cointab_chat',
  password: 'Krishna@123', // The password you set during PostgreSQL installation
  port: 5432,
});

module.exports = pool;