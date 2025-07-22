const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', 
  host: 'localhost',
  database: 'cointab_chat',
  password: 'Krishna@123', 
  port: 5432,
});

module.exports = pool;