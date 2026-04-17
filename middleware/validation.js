const REQUIRED_FIELDS = ['lat', 'lng', 'pm25', 'pm10', 'temp', 'humidity', 'pressure', 'mq7', 'mq135'];
const NUMERIC_FIELDS = ['lat', 'lng', 'pm25', 'pm10', 'temp', 'humidity', 'pressure', 'mq7', 'mq135'];
const VALID_RANGES = {
  lat: { min: -90, max: 90 },
  lng: { min: -180, max: 180 },
  pm25: { min: 0, max: 2000 },
  pm10: { min: 0, max: 2000 },
  temp: { min: -50, max: 80 },
  humidity: { min: 0, max: 100 },
  pressure: { min: 300, max: 1100 },
  mq7: { min: 0, max: 1000 },
  mq135: { min: 0, max: 1000 },
};

/**
 
 * @param {Object} reading - The reading to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
const validateReading = (reading) => {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (reading[field] === undefined || reading[field] === null || reading[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  for (const field of NUMERIC_FIELDS) {
    if (reading[field] !== undefined && reading[field] !== null) {
      const value = Number(reading[field]);
      if (isNaN(value)) {
        errors.push(`${field} must be a valid number`);
      } else {
        const range = VALID_RANGES[field];
        if (value < range.min || value > range.max) {
          errors.push(`${field} must be between ${range.min} and ${range.max}`);
        }
      }
    }
  }
  const validFields = new Set(REQUIRED_FIELDS);
  for (const field in reading) {
    if (!validFields.has(field)) {
      console.warn(`Warning: Unknown field '${field}' in reading`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

const validateReadingMiddleware = (req, res, next) => {
  const validation = validateReading(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid reading data',
      details: validation.errors,
    });
  }

  next();
};

const validateQueryParams = (req, res, next) => {
  const { start, end, limit } = req.query;
  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100000) {
      return res.status(400).json({
        error: 'Invalid limit parameter',
        details: ['limit must be a number between 1 and 100000'],
      });
    }
  }

  if (start !== undefined) {
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid start parameter',
        details: ['start must be a valid ISO 8601 timestamp'],
      });
    }
  }

  if (end !== undefined) {
    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid end parameter',
        details: ['end must be a valid ISO 8601 timestamp'],
      });
    }
  }

  next();
};

module.exports = {
  validateReading,
  validateReadingMiddleware,
  validateQueryParams,
  REQUIRED_FIELDS,
  NUMERIC_FIELDS,
  VALID_RANGES,
};
