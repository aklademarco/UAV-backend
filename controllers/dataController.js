const { getAll, getOne, query } = require('../db/database');
const { validateReading } = require('../middleware/validation');
const insertReading = async (req, res) => {
  try {
    const { lat, lng, pm25, pm10, temp, humidity, pressure, mq7, mq135 } = req.body;

    const validation = validateReading(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid reading data',
        details: validation.errors,
      });
    }
    const result = await query(
      `INSERT INTO readings (lat, lng, pm25, pm10, temp, humidity, pressure, mq7, mq135)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [lat, lng, pm25, pm10, temp, humidity, pressure, mq7, mq135]
    );

    res.status(201).json({
      status: 'success',
      message: 'Reading inserted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error inserting reading:', error);
    res.status(500).json({
      error: 'Failed to insert reading',
      details: error.message,
    });
  }
};

const getAllReadings = async (req, res) => {
  try {
    const { start, end, limit = 1000 } = req.query;
    let sql = 'SELECT * FROM readings';
    const params = [];
    let paramCount = 1;
    const conditions = [];

    if (start) {
      conditions.push(`created_at >= $${paramCount++}`);
      params.push(start);
    }

    if (end) {
      conditions.push(`created_at <= $${paramCount++}`);
      params.push(end);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit, 10));

    const result = await query(sql, params);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({
      error: 'Failed to fetch readings',
      details: error.message,
    });
  }
};

const getLatestReading = async (req, res) => {
  try {
    const sql = 'SELECT * FROM readings ORDER BY created_at DESC LIMIT 1';
    const result = await getOne(sql, []);

    if (!result) {
      return res.status(404).json({
        error: 'No readings found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Error fetching latest reading:', error);
    res.status(500).json({
      error: 'Failed to fetch latest reading',
      details: error.message,
    });
  }
};

const deleteAllReadings = async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== true) {
      return res.status(400).json({
        error: 'Deletion not confirmed',
        details: ['Send { "confirm": true } to confirm deletion of all readings'],
      });
    }

    const result = await query('DELETE FROM readings', []);

    res.status(200).json({
      status: 'success',
      message: 'All readings deleted',
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error('Error deleting readings:', error);
    res.status(500).json({
      error: 'Failed to delete readings',
      details: error.message,
    });
  }
};
const getStatistics = async (req, res) => {
  try {
    const { start, end } = req.query;
    let sql = `
      SELECT
        COUNT(*) as total_readings,
        AVG(pm25) as avg_pm25,
        MAX(pm25) as max_pm25,
        MIN(pm25) as min_pm25,
        AVG(pm10) as avg_pm10,
        MAX(pm10) as max_pm10,
        MIN(pm10) as min_pm10,
        AVG(temp) as avg_temp,
        MAX(temp) as max_temp,
        MIN(temp) as min_temp,
        AVG(humidity) as avg_humidity,
        MAX(humidity) as max_humidity,
        MIN(humidity) as min_humidity,
        AVG(pressure) as avg_pressure,
        MAX(pressure) as max_pressure,
        MIN(pressure) as min_pressure,
        AVG(mq7) as avg_mq7,
        MAX(mq7) as max_mq7,
        MIN(mq7) as min_mq7,
        AVG(mq135) as avg_mq135,
        MAX(mq135) as max_mq135,
        MIN(mq135) as min_mq135,
        MIN(created_at) as first_reading,
        MAX(created_at) as last_reading
      FROM readings
    `;

    const params = [];
    let paramCount = 1;
    const conditions = [];

    if (start) {
      conditions.push(`created_at >= $${paramCount++}`);
      params.push(start);
    }

    if (end) {
      conditions.push(`created_at <= $${paramCount++}`);
      params.push(end);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await query(sql, params);
    const stats = result.rows[0];
    const convertedStats = {};
    for (const [key, value] of Object.entries(stats)) {
      if (typeof value === 'string' && !isNaN(value)) {
        convertedStats[key] = parseFloat(value);
      } else {
        convertedStats[key] = value;
      }
    }

    res.status(200).json({
      status: 'success',
      data: convertedStats,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      details: error.message,
    });
  }
};

const getAggregatedReadings = async (req, res) => {
  try {
    const { interval = 'hour', start, end } = req.query;
    const validIntervals = ['hour', 'day'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({
        error: 'Invalid interval',
        details: [`interval must be one of: ${validIntervals.join(', ')}`],
      });
    }

    const formatString = interval === 'hour' ? 'YYYY-MM-DD HH:00:00' : 'YYYY-MM-DD';

    let sql = `
      SELECT
        DATE_TRUNC('${interval}', created_at) as time_bucket,
        COUNT(*) as count,
        AVG(pm25) as avg_pm25,
        MAX(pm25) as max_pm25,
        MIN(pm25) as min_pm25,
        AVG(pm10) as avg_pm10,
        AVG(temp) as avg_temp,
        AVG(humidity) as avg_humidity,
        AVG(mq7) as avg_mq7,
        AVG(mq135) as avg_mq135
      FROM readings
    `;

    const params = [];
    let paramCount = 1;
    const conditions = [];

    if (start) {
      conditions.push(`created_at >= $${paramCount++}`);
      params.push(start);
    }

    if (end) {
      conditions.push(`created_at <= $${paramCount++}`);
      params.push(end);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY DATE_TRUNC(\'' + interval + '\', created_at) ORDER BY time_bucket DESC';

    const result = await query(sql, params);

    res.status(200).json({
      status: 'success',
      interval,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching aggregated readings:', error);
    res.status(500).json({
      error: 'Failed to fetch aggregated readings',
      details: error.message,
    });
  }
};

module.exports = {
  insertReading,
  getAllReadings,
  getLatestReading,
  deleteAllReadings,
  getStatistics,
  getAggregatedReadings,
};
