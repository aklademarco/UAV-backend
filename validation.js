/**
 * Validation middleware for air quality data
 */

// Required fields for air quality reading
const REQUIRED_FIELDS = [
  "lat",
  "lng",
  "pm25",
  "pm10",
  "temp",
  "humidity",
  "pressure",
  "mq7",
  "mq135",
];

/**
 * Validate that all required numeric fields are present and valid
 */
function validateReadingData(req, res, next) {
  const data = req.body;

  // Check if body exists
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({
      error: "Request body is empty",
      required_fields: REQUIRED_FIELDS,
    });
  }

  // Check for missing fields
  const missingFields = REQUIRED_FIELDS.filter((field) => !(field in data));
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Missing required fields",
      missing_fields: missingFields,
      required_fields: REQUIRED_FIELDS,
    });
  }

  // Validate that all fields are numbers
  for (const field of REQUIRED_FIELDS) {
    const value = data[field];

    if (typeof value !== "number" || isNaN(value)) {
      return res.status(400).json({
        error: `Field "${field}" must be a number, got: ${typeof value}`,
        field: field,
        value: value,
      });
    }

    // Reasonable range checks
    if (field === "lat" && (value < -90 || value > 90)) {
      return res.status(400).json({
        error: "Latitude must be between -90 and 90",
        field: "lat",
        value: value,
      });
    }

    if (field === "lng" && (value < -180 || value > 180)) {
      return res.status(400).json({
        error: "Longitude must be between -180 and 180",
        field: "lng",
        value: value,
      });
    }

    // PM and sensor values should be non-negative
    if (
      ["pm25", "pm10", "temp", "humidity", "pressure", "mq7", "mq135"].includes(
        field,
      )
    ) {
      if (value < 0) {
        return res.status(400).json({
          error: `Field "${field}" cannot be negative`,
          field: field,
          value: value,
        });
      }
    }

    // Humidity should be 0-100
    if (field === "humidity" && (value < 0 || value > 100)) {
      return res.status(400).json({
        error: "Humidity must be between 0 and 100",
        field: "humidity",
        value: value,
      });
    }
  }

  // Data is valid, proceed
  next();
}

/**
 * Validate query parameters
 */
function validateQueryParams(req, res, next) {
  const { limit, start, end } = req.query;

  // Validate limit
  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100000) {
      return res.status(400).json({
        error: "Limit must be a number between 1 and 100000",
        limit: limit,
      });
    }
  }

  // Validate start timestamp
  if (start !== undefined) {
    const startDate = new Date(start);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        error: "Start parameter must be a valid ISO 8601 date string",
        start: start,
      });
    }
  }

  // Validate end timestamp
  if (end !== undefined) {
    const endDate = new Date(end);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "End parameter must be a valid ISO 8601 date string",
        end: end,
      });
    }
  }

  next();
}

module.exports = {
  validateReadingData,
  validateQueryParams,
  REQUIRED_FIELDS,
};
