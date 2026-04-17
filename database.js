const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(process.cwd(), "data", "air_quality.db");


const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}


const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database at:", DB_PATH);
    initializeDatabase();
  }
});


function initializeDatabase() {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        pm25 REAL NOT NULL,
        pm10 REAL NOT NULL,
        temp REAL NOT NULL,
        humidity REAL NOT NULL,
        pressure REAL NOT NULL,
        mq7 REAL NOT NULL,
        mq135 REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) console.error("Error creating readings table:", err);
        else console.log("Readings table initialized");
      },
    );

    db.run(
      `CREATE INDEX IF NOT EXISTS idx_created_at ON readings(created_at)`,
      (err) => {
        if (err) console.error("Error creating index:", err);
        else console.log("Index on created_at created");
      },
    );

    db.run(
      `CREATE INDEX IF NOT EXISTS idx_coordinates ON readings(lat, lng)`,
      (err) => {
        if (err) console.error("Error creating coordinate index:", err);
        else console.log("Index on coordinates created");
      },
    );
  });
}


function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}


function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}


function getAllRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = { db, runQuery, getRow, getAllRows };
