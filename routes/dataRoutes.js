const express = require('express');
const {
  insertReading,
  getAllReadings,
  getLatestReading,
  deleteAllReadings,
  getStatistics,
  getAggregatedReadings,
} = require('../controllers/dataController');
const { validateReadingMiddleware, validateQueryParams } = require('../middleware/validation');

const router = express.Router();
router.post('/data', validateReadingMiddleware, insertReading);
router.get('/data', validateQueryParams, getAllReadings);
router.get('/data/latest', getLatestReading);
router.get('/stats', validateQueryParams, getStatistics);
router.get('/aggregated', validateQueryParams, getAggregatedReadings);
router.delete('/data', deleteAllReadings);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
