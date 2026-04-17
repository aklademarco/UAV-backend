# UAV Air Quality Monitoring Backend API

A robust, production-ready REST API for the UAV-based air quality monitoring system. Built with Node.js, Express, and Neon PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm
- Neon PostgreSQL database (https://neon.tech)

### Setup

1. **Install dependencies**
```bash
cd server
npm install
```

2. **Create .env file**
```bash
cp .env.example .env
```

3. **Configure environment variables**
Edit `.env` and add your Neon PostgreSQL connection string:
```
DATABASE_URL=postgresql://user:password@ep-XXXXX.neon.tech/database_name
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

4. **Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📊 Database Schema

### `readings` Table

```sql
CREATE TABLE readings (
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
);

CREATE INDEX idx_readings_created_at ON readings(created_at DESC);
```

## 🔌 API Endpoints

### 1. Submit Sensor Data (POST)

**Endpoint:** `POST /api/data`

**Description:** Submit a new environmental reading from the ESP32 sensor

**Request Body:**
```json
{
  "lat": 5.6037,
  "lng": -0.1870,
  "pm25": 45.5,
  "pm10": 70.3,
  "temp": 28.5,
  "humidity": 72.0,
  "pressure": 1009.2,
  "mq7": 320.0,
  "mq135": 410.5
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Reading inserted successfully",
  "data": {
    "id": 1,
    "lat": "5.60370000",
    "lng": "-0.18700000",
    "pm25": "45.50",
    "pm10": "70.30",
    "temp": "28.50",
    "humidity": "72.00",
    "pressure": "1009.20",
    "mq7": "320.00",
    "mq135": "410.50",
    "created_at": "2026-04-14T15:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Invalid reading data",
  "details": [
    "pm25 must be between 0 and 2000",
    "humidity must be between 0 and 100"
  ]
}
```

---

### 2. Get All Readings (GET)

**Endpoint:** `GET /api/data`

**Description:** Retrieve all stored readings with optional filtering and pagination

**Query Parameters:**
- `start` (optional): ISO 8601 timestamp - get readings after this time
- `end` (optional): ISO 8601 timestamp - get readings before this time
- `limit` (optional): Maximum number of results (default: 1000, max: 100000)

**Examples:**
```bash
# Get all readings
GET /api/data

# Get readings from last 24 hours
GET /api/data?start=2026-04-13T15:30:00Z

# Get last 100 readings
GET /api/data?limit=100

# Get readings between two dates
GET /api/data?start=2026-04-10T00:00:00Z&end=2026-04-14T00:00:00Z
```

**Response (200):**
```json
{
  "status": "success",
  "count": 150,
  "data": [
    {
      "id": 150,
      "lat": "5.60370000",
      "lng": "-0.18700000",
      "pm25": "45.50",
      ...
      "created_at": "2026-04-14T15:30:00Z"
    },
    ...
  ]
}
```

---

### 3. Get Latest Reading (GET)

**Endpoint:** `GET /api/data/latest`

**Description:** Get the most recent sensor reading

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": 150,
    "lat": "5.60370000",
    "lng": "-0.18700000",
    "pm25": "45.50",
    "pm10": "70.30",
    "temp": "28.50",
    "humidity": "72.00",
    "pressure": "1009.20",
    "mq7": "320.00",
    "mq135": "410.50",
    "created_at": "2026-04-14T15:30:00Z"
  }
}
```

---

### 4. Get Statistics (GET)

**Endpoint:** `GET /api/stats`

**Description:** Get aggregate statistics of all readings

**Query Parameters:**
- `start` (optional): ISO 8601 timestamp
- `end` (optional): ISO 8601 timestamp

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "total_readings": 1500,
    "avg_pm25": 45.2,
    "max_pm25": 150.5,
    "min_pm25": 5.2,
    "avg_pm10": 65.3,
    "max_pm10": 200.0,
    "min_pm10": 15.0,
    "avg_temp": 28.3,
    "max_temp": 35.5,
    "min_temp": 22.1,
    "avg_humidity": 70.5,
    "max_humidity": 95.0,
    "min_humidity": 45.0,
    "avg_pressure": 1009.5,
    "max_pressure": 1015.0,
    "min_pressure": 1003.2,
    "avg_mq7": 320.5,
    "max_mq7": 500.0,
    "min_mq7": 100.0,
    "avg_mq135": 410.3,
    "max_mq135": 650.0,
    "min_mq135": 200.0,
    "first_reading": "2026-04-01T10:00:00Z",
    "last_reading": "2026-04-14T15:30:00Z"
  }
}
```

---

### 5. Get Aggregated Readings (GET)

**Endpoint:** `GET /api/aggregated`

**Description:** Get readings aggregated by time interval (hourly or daily)

**Query Parameters:**
- `interval` (optional): 'hour' or 'day' (default: 'hour')
- `start` (optional): ISO 8601 timestamp
- `end` (optional): ISO 8601 timestamp

**Examples:**
```bash
# Get hourly aggregates
GET /api/aggregated?interval=hour

# Get daily aggregates
GET /api/aggregated?interval=day

# Get last week daily averages
GET /api/aggregated?interval=day&start=2026-04-07T00:00:00Z
```

**Response (200):**
```json
{
  "status": "success",
  "interval": "hour",
  "count": 24,
  "data": [
    {
      "time_bucket": "2026-04-14T15:00:00Z",
      "count": 60,
      "avg_pm25": 45.5,
      "max_pm25": 85.0,
      "min_pm25": 20.3,
      "avg_pm10": 65.3,
      "avg_temp": 28.5,
      "avg_humidity": 70.0,
      "avg_mq7": 320.0,
      "avg_mq135": 410.0
    },
    ...
  ]
}
```

---

### 6. Delete All Readings (DELETE)

**Endpoint:** `DELETE /api/data`

**Description:** Clear all readings from the database (requires confirmation)

**Request Body:**
```json
{
  "confirm": true
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "All readings deleted",
  "deletedCount": 1500
}
```

**Error (without confirmation):**
```json
{
  "error": "Deletion not confirmed",
  "details": ["Send { \"confirm\": true } to confirm deletion of all readings"]
}
```

---

### 7. Health Check (GET)

**Endpoint:** `GET /api/health`

**Description:** Check if the API is running

**Response (200):**
```json
{
  "status": "success",
  "message": "API is running",
  "timestamp": "2026-04-14T15:30:00Z"
}
```

---

## 🔍 Data Validation

### Required Fields
All sensor readings must include these fields:
- `lat` (latitude): -90 to 90
- `lng` (longitude): -180 to 180
- `pm25`: 0 to 2000 µg/m³
- `pm10`: 0 to 2000 µg/m³
- `temp`: -50 to 80 °C
- `humidity`: 0 to 100 %
- `pressure`: 300 to 1100 hPa
- `mq7`: 0 to 1000 ppm
- `mq135`: 0 to 1000 ppm

### Validation Example
```bash
# Invalid request (humidity > 100)
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"lat": 5.6, "lng": -0.1, ..., "humidity": 105}'

# Response
{
  "error": "Invalid reading data",
  "details": ["humidity must be between 0 and 100"]
}
```

---

## 📝 Usage Examples

### ESP32 Arduino Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://your-server-ip:3000/api/data";

void sendReading(float lat, float lng, float pm25, float pm10,
                 float temp, float humidity, float pressure,
                 float mq7, float mq135) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["lat"] = lat;
    doc["lng"] = lng;
    doc["pm25"] = pm25;
    doc["pm10"] = pm10;
    doc["temp"] = temp;
    doc["humidity"] = humidity;
    doc["pressure"] = pressure;
    doc["mq7"] = mq7;
    doc["mq135"] = mq135;

    String payload;
    serializeJson(doc, payload);

    int httpCode = http.POST(payload);
    if (httpCode == 201) {
      Serial.println("Reading sent successfully");
    } else {
      Serial.println("Failed to send reading");
    }
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  // ... rest of setup
}

void loop() {
  // Read sensors
  float lat = 5.6037;
  float lng = -0.1870;
  float pm25 = 45.5;
  float pm10 = 70.3;
  float temp = 28.5;
  float humidity = 72.0;
  float pressure = 1009.2;
  float mq7 = 320.0;
  float mq135 = 410.5;

  // Send reading
  sendReading(lat, lng, pm25, pm10, temp, humidity, pressure, mq7, mq135);

  // Wait 5 minutes before next reading
  delay(300000);
}
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function submitReading(data) {
  try {
    const response = await axios.post(`${API_URL}/data`, data);
    console.log('Reading submitted:', response.data);
  } catch (error) {
    console.error('Error submitting reading:', error);
  }
}

async function getAllReadings(options = {}) {
  try {
    const response = await axios.get(`${API_URL}/data`, { params: options });
    console.log('Readings:', response.data);
  } catch (error) {
    console.error('Error fetching readings:', error);
  }
}

async function getStatistics() {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    console.log('Statistics:', response.data.data);
  } catch (error) {
    console.error('Error fetching statistics:', error);
  }
}

// Submit a reading
submitReading({
  lat: 5.6037,
  lng: -0.1870,
  pm25: 45.5,
  pm10: 70.3,
  temp: 28.5,
  humidity: 72.0,
  pressure: 1009.2,
  mq7: 320.0,
  mq135: 410.5
});

// Get all readings
getAllReadings({ limit: 100 });

// Get statistics
getStatistics();
```

---

## 🔒 Security Considerations

1. **Data Validation**: All inputs are validated against expected ranges
2. **SQL Injection Prevention**: Uses parameterized queries
3. **CORS**: Configured to only accept requests from dashboard
4. **Environment Variables**: Sensitive data stored in `.env` file
5. **Error Messages**: Production errors don't leak stack traces

---

## 🚀 Deployment

### Render.com

1. Push to GitHub
2. Connect repository to Render
3. Set environment variables:
   - `DATABASE_URL`: Your Neon PostgreSQL URL
   - `NODE_ENV`: production
   - `CORS_ORIGIN`: Your dashboard URL
4. Deploy

### Railway.app

```bash
railway link
railway up
```

### Environment Variables
```
DATABASE_URL=postgresql://...
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-dashboard-domain.com
```

---

## 📊 Performance Features

- **Connection Pooling**: Efficiently manages database connections
- **Indexed Queries**: Fast retrieval by timestamp
- **Query Limits**: Prevents memory overload from large datasets
- **Aggregation**: Efficient time-series aggregation using PostgreSQL
- **Request Logging**: Monitor API usage

---

## 🛠️ Project Structure

```
server/
├── index.js                          # Express server setup
├── package.json                      # Dependencies
├── .env.example                      # Environment template
├── db/
│   └── database.js                   # PostgreSQL connection pool
├── routes/
│   └── dataRoutes.js                 # API endpoints
├── controllers/
│   └── dataController.js             # Business logic
└── middleware/
    └── validation.js                 # Input validation
```

---

## 🐛 Troubleshooting

### Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
- Ensure the server is running: `npm run dev`
- Check PORT in `.env`

### Database Issues
```
Error: ENOENT: no such file or directory
```
- Ensure `DATABASE_URL` is set in `.env`
- Verify Neon connection string is correct

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
- Verify dashboard URL matches `CORS_ORIGIN` in `.env`
- Check browser console for full error message

---

## 📈 Monitoring

### Check Server Status
```bash
curl http://localhost:3000/api/health
```

### View Request Logs
Logs are printed to console with timestamps:
```
[2026-04-14T15:30:00.123Z] POST /api/data
[2026-04-14T15:30:01.456Z] GET /api/data
```

---

## 📝 License
Engineering Project - All Rights Reserved

## 🆘 Support
For issues, check:
1. `.env` configuration
2. Database connection
3. Node version compatibility
4. Network/firewall settings

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Status**: Production Ready
