
const { runQuery, getRow, getAllRows } = require("./database");

async function addReading(req, res) {
  try {
    const { lat, lng, pm25, pm10, temp, humidity, pressure, mq7, mq135 } =
      req.body;

    const sql = `
      INSERT INTO readings (lat, lng, pm25, pm10, temp, humidity, pressure, mq7, mq135)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [lat, lng, pm25, pm10, temp, humidity, pressure, mq7, mq135];
    const result = await runQuery(sql, params);

    res.status(201).json({
      status: "success",
      message: "Reading stored successfully",
      id: result.lastID,
    });
  } catch (error) {
    console.error("Error adding reading:", error);
    res.status(500).json({
      error: "Failed to store reading",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

async function getAllReadings(req, res) {
  try {
    let sql = "SELECT * FROM readings";
    const params = [];
    const conditions = [];


    if (req.query.start) {
      conditions.push("created_at >= ?");
      params.push(new Date(req.query.start).toISOString());
    }

    if (req.query.end) {
      conditions.push("created_at <= ?");
      params.push(new Date(req.query.end).toISOString());
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    
    sql += " ORDER BY created_at DESC";

    let limit = 10000;
    if (req.query.limit) {
      limit = Math.min(parseInt(req.query.limit, 10), 100000);
    }
    sql += ` LIMIT ${limit}`;

    const readings = await getAllRows(sql, params);

    res.json({
      status: "success",
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error("Error fetching readings:", error);
    res.status(500).json({
      error: "Failed to fetch readings",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

async function getLatestReading(req, res) {
  try {
    const reading = await getRow(
      "SELECT * FROM readings ORDER BY created_at DESC LIMIT 1",
    );

    if (!reading) {
      return res.status(404).json({
        error: "No readings found",
      });
    }

    res.json({
      status: "success",
      data: reading,
    });
  } catch (error) {
    console.error("Error fetching latest reading:", error);
    res.status(500).json({
      error: "Failed to fetch latest reading",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}


async function getStatistics(req, res) {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_readings,
        AVG(pm25) as avg_pm25,
        AVG(pm10) as avg_pm10,
        AVG(temp) as avg_temp,
        AVG(humidity) as avg_humidity,
        AVG(pressure) as avg_pressure,
        AVG(mq7) as avg_co,
        AVG(mq135) as avg_air_quality,
        MIN(pm25) as min_pm25,
        MAX(pm25) as max_pm25,
        MIN(temp) as min_temp,
        MAX(temp) as max_temp,
        MIN(created_at) as first_reading,
        MAX(created_at) as last_reading
      FROM readings
    `;

    const stats = await getRow(sql);

    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      error: "Failed to fetch statistics",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}


async function deleteAllReadings(req, res) {
  try {
    const result = await runQuery("DELETE FROM readings");

    res.json({
      status: "success",
      message: "All readings deleted",
      deleted_count: result.changes,
    });
  } catch (error) {
    console.error("Error deleting readings:", error);
    res.status(500).json({
      error: "Failed to delete readings",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}


async function exportAsCSV(req, res) {
  try {
    const readings = await getAllRows(
      "SELECT * FROM readings ORDER BY created_at ASC",
    );

    if (readings.length === 0) {
      return res.status(404).json({
        error: "No data to export",
      });
    }

   
    const headers = [
      "ID",
      "Latitude",
      "Longitude",
      "PM2.5 (µg/m³)",
      "PM10 (µg/m³)",
      "Temperature (°C)",
      "Humidity (%)",
      "Pressure (hPa)",
      "CO (MQ-7)",
      "Air Quality (MQ-135)",
      "Timestamp",
    ];

    
    const rows = readings.map((r) => [
      r.id,
      r.lat,
      r.lng,
      r.pm25,
      r.pm10,
      r.temp,
      r.humidity,
      r.pressure,
      r.mq7,
      r.mq135,
      r.created_at,
    ]);

    
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="air-quality-${new Date().toISOString().split("T")[0]}.csv"`,
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      error: "Failed to export data",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

module.exports = {
  addReading,
  getAllReadings,
  getLatestReading,
  getStatistics,
  deleteAllReadings,
  exportAsCSV,
};
