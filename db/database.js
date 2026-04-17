const { Pool } = require("pg");
require("dotenv").config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        pm25 DECIMAL(8, 2) NOT NULL,
        pm10 DECIMAL(8, 2) NOT NULL,
        temp DECIMAL(6, 2) NOT NULL,
        humidity DECIMAL(5, 2) NOT NULL,
        pressure DECIMAL(8, 2) NOT NULL,
        mq7 DECIMAL(8, 2) NOT NULL,
        mq135 DECIMAL(8, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_readings_created_at
      ON readings(created_at DESC)
    `);

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};


const query = (text, params) => pool.query(text, params);
const getOne = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows.length > 0 ? result.rows[0] : null;
};
const getAll = async (text, params) => {
  const result = await pool.query(text, params);
  return result.rows;
};
const closePool = async () => {
  await pool.end();
  console.log("Connection pool closed");
};

module.exports = {
  pool,
  query,
  getOne,
  getAll,
  initializeDatabase,
  closePool,
};
