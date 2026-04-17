const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { initializeDatabase, closePool } = require('./db/database');
const dataRoutes = require('./routes/dataRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';




app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
}));


app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use('/api', dataRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'UAV Air Quality Monitoring API',
    version: '1.0.0',
    endpoints: {
      'POST /api/data': 'Insert a new reading',
      'GET /api/data': 'Get all readings (with optional filtering)',
      'GET /api/data/latest': 'Get the latest reading',
      'GET /api/stats': 'Get statistics/aggregates',
      'GET /api/aggregated': 'Get time-aggregated readings',
      'DELETE /api/data': 'Clear all readings (requires confirmation)',
      'GET /api/health': 'Health check',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    details: NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

const startServer = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log(`Starting server in ${NODE_ENV} mode...`);
    await initializeDatabase();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 CORS enabled for: ${CORS_ORIGIN}`);
      console.log(`📊 Database: Neon PostgreSQL`);
      console.log(`\n📋 API Documentation:`);
      console.log(`   http://localhost:${PORT}`);
    });
    process.on('SIGTERM', async () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
