# Raspberry Pi iOS Bridge - Local API Documentation

REST API documentation for the Pi local API server running on port 3000.

**Base URL (AP Mode):** `http://192.168.50.1:3000`
**Base URL (Client Mode):** `http://<pi-ip-address>:3000`

---

## API Overview

The Pi API provides HTTP endpoints for:
- iOS device information
- Battery status monitoring
- Screenshot capture
- System log streaming
- Data synchronization

All responses are JSON format. CORS is enabled for mobile app access.

---

## Health & Status

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T10:30:00.000Z",
  "uptime": 3600
}
```

### GET /

API information and available endpoints.

**Response:**
```json
{
  "name": "Raspberry Pi iOS Bridge API",
  "version": "1.0.0",
  "endpoints": {
    "device": "/api/device/info",
    "battery": "/api/battery",
    "screenshot": "/api/screenshot",
    "syslog": "/api/syslog",
    "sync": "/api/sync"
  }
}
```

---

## Device Endpoints

### GET /api/device/list

List all connected iOS devices.

**Response:**
```json
{
  "success": true,
  "count": 1,
  "devices": [
    "00008150-000971D00A20401C"
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - No devices or error

---

### GET /api/device/info

Get detailed device information.

**Query Parameters:**
- `udid` (optional) - Specific device UDID. If omitted, uses first connected device.

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/device/info
curl http://192.168.50.1:3000/api/device/info?udid=00008150-000971D00A20401C
```

**Response:**
```json
{
  "success": true,
  "device": {
    "udid": "00008150-000971D00A20401C",
    "name": "iPhone",
    "model": "iPhone18,2",
    "ios_version": "26.2",
    "serial_number": "DMQXXXXXXXX",
    "wifi_address": "xx:xx:xx:xx:xx:xx",
    "bluetooth_address": "xx:xx:xx:xx:xx:xx",
    "raw": {
      "DeviceName": "iPhone",
      "ProductType": "iPhone18,2",
      "ProductVersion": "26.2",
      ...
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Device not found or error

---

### GET /api/device/name

Get device name only.

**Query Parameters:**
- `udid` (optional)

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/device/name
```

**Response:**
```json
{
  "success": true,
  "name": "iPhone"
}
```

---

### GET /api/device/pairing

Check device pairing status.

**Query Parameters:**
- `udid` (optional)

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/device/pairing
```

**Response:**
```json
{
  "success": true,
  "paired": true
}
```

**Note:** Device must be unlocked and trusted for pairing to succeed.

---

### GET /api/device/history

Get device connection history from local database.

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/device/history
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "devices": [
    {
      "id": 1,
      "udid": "00008150-000971D00A20401C",
      "name": "iPhone",
      "model": "iPhone18,2",
      "ios_version": "26.2",
      "first_seen": "2026-01-21 10:00:00",
      "last_seen": "2026-01-21 15:30:00",
      "synced": 1
    }
  ]
}
```

---

## Battery Endpoints

### GET /api/battery

Get current battery status.

**Query Parameters:**
- `udid` (optional)

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/battery
```

**Response:**
```json
{
  "success": true,
  "battery": {
    "level": 85,
    "is_charging": false,
    "external_connected": true,
    "external_charge_capable": true,
    "raw": {
      "BatteryCurrentCapacity": "85",
      "BatteryIsCharging": "false",
      "ExternalConnected": "true",
      ...
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Device not found or error

---

### GET /api/battery/history

Get battery status history.

**Query Parameters:**
- `udid` (required) - Device UDID
- `hours` (optional, default: 24) - History window in hours

**Example Request:**
```bash
curl "http://192.168.50.1:3000/api/battery/history?udid=00008150-000971D00A20401C&hours=12"
```

**Response:**
```json
{
  "success": true,
  "count": 48,
  "history": [
    {
      "id": 1,
      "device_udid": "00008150-000971D00A20401C",
      "level": 85,
      "state": "discharging",
      "timestamp": "2026-01-21 15:30:00",
      "synced": 0
    },
    ...
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing UDID parameter
- `500` - Database error

---

## Screenshot Endpoints

### GET /api/screenshot

Capture a screenshot from the connected iOS device.

**Query Parameters:**
- `udid` (optional)

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/screenshot > screenshot.png
```

**Response:**
- Content-Type: `image/png`
- Body: PNG image file

**Note:** Requires developer disk image to be mounted on device (iOS 9+).

**Status Codes:**
- `200` - Success, returns PNG file
- `404` - No device connected
- `500` - Screenshot capture failed

---

### GET /api/screenshot/list

List captured screenshots from database.

**Query Parameters:**
- `udid` (required) - Device UDID
- `limit` (optional, default: 50) - Max number of results

**Example Request:**
```bash
curl "http://192.168.50.1:3000/api/screenshot/list?udid=00008150-000971D00A20401C&limit=10"
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "screenshots": [
    {
      "id": 1,
      "device_udid": "00008150-000971D00A20401C",
      "filename": "screenshot_00008150-000971D00A20401C_1737462600000.png",
      "filepath": "/home/pi/raspi-ios-bridge/pi-api/screenshots/screenshot_00008150-000971D00A20401C_1737462600000.png",
      "captured_at": "2026-01-21 15:30:00",
      "synced": 0
    },
    ...
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing UDID parameter
- `500` - Database error

---

### GET /api/screenshot/:id

Get a specific screenshot by database ID.

**Path Parameters:**
- `id` - Screenshot database ID

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/screenshot/1 > screenshot.png
```

**Response:**
- Content-Type: `image/png`
- Body: PNG image file

**Status Codes:**
- `200` - Success, returns PNG file
- `404` - Screenshot not found
- `500` - Error

---

## System Log Endpoints

### GET /api/syslog/stream

Stream live system logs from iOS device (Server-Sent Events).

**Query Parameters:**
- `udid` (optional)

**Example Request:**
```bash
curl -N http://192.168.50.1:3000/api/syslog/stream
```

**Response:**
- Content-Type: `text/event-stream`
- Body: Streaming log entries

**Event Format:**
```
data: {"log":"SpringBoard[xx]: Some log entry","timestamp":"2026-01-21T15:30:00.000Z"}

data: {"log":"kernel[0]: Another log entry","timestamp":"2026-01-21T15:30:01.000Z"}
```

**JavaScript Client Example:**
```javascript
const eventSource = new EventSource('http://192.168.50.1:3000/api/syslog/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.timestamp, data.log);
};

eventSource.onerror = () => {
  eventSource.close();
};
```

**Note:** Logs are also saved to local database.

---

### GET /api/syslog/history

Get stored system logs from database.

**Query Parameters:**
- `udid` (required) - Device UDID
- `limit` (optional, default: 100) - Max number of log entries

**Example Request:**
```bash
curl "http://192.168.50.1:3000/api/syslog/history?udid=00008150-000971D00A20401C&limit=50"
```

**Response:**
```json
{
  "success": true,
  "count": 50,
  "logs": [
    {
      "id": 1,
      "device_udid": "00008150-000971D00A20401C",
      "log_entry": "SpringBoard[xx]: Application launched",
      "timestamp": "2026-01-21 15:30:00",
      "synced": 0
    },
    ...
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing UDID parameter
- `500` - Database error

---

## Sync Endpoints

### POST /api/sync/trigger

Manually trigger data synchronization to backend server.

**Example Request:**
```bash
curl -X POST http://192.168.50.1:3000/api/sync/trigger
```

**Response:**
```json
{
  "success": true,
  "sync_results": {
    "processed": 25,
    "succeeded": 24,
    "failed": 1,
    "errors": [
      {
        "operation_id": 15,
        "error": "Connection timeout"
      }
    ]
  }
}
```

**Note:** Only works when backend URL is configured and Pi is in client mode (online).

---

### GET /api/sync/status

Get synchronization queue status and statistics.

**Example Request:**
```bash
curl http://192.168.50.1:3000/api/sync/status
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "pending": 10,
    "processing": 0,
    "completed": 245,
    "failed": 3,
    "last_successful_sync": "2026-01-21 15:25:00"
  },
  "pending_operations": [
    {
      "id": 1,
      "operation_type": "create",
      "data_type": "screenshot",
      "record_id": 5,
      "created_at": "2026-01-21 15:30:00",
      "attempts": 0,
      "status": "pending"
    },
    ...
  ]
}
```

---

### GET /api/sync/unsynced

Get unsynced records by type.

**Query Parameters:**
- `type` (required) - Data type: `screenshot`, `log`, or `battery`

**Example Request:**
```bash
curl "http://192.168.50.1:3000/api/sync/unsynced?type=screenshot"
```

**Response:**
```json
{
  "success": true,
  "data_type": "screenshot",
  "count": 5,
  "records": [
    {
      "id": 10,
      "device_udid": "00008150-000971D00A20401C",
      "filename": "screenshot_...",
      "filepath": "/path/to/file",
      "captured_at": "2026-01-21 15:30:00",
      "synced": 0
    },
    ...
  ]
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid or missing type parameter
- `500` - Database error

---

### POST /api/sync/mark-synced

Mark records as synced (typically called by backend after successful sync).

**Request Body:**
```json
{
  "data_type": "screenshot",
  "ids": [1, 2, 3, 4, 5]
}
```

**Example Request:**
```bash
curl -X POST http://192.168.50.1:3000/api/sync/mark-synced \
  -H "Content-Type: application/json" \
  -d '{"data_type":"screenshot","ids":[1,2,3]}'
```

**Response:**
```json
{
  "success": true,
  "message": "Marked 3 screenshot records as synced"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid parameters
- `500` - Database error

---

### POST /api/sync/cleanup

Clean up old completed sync operations.

**Request Body:**
```json
{
  "days": 7
}
```

**Example Request:**
```bash
curl -X POST http://192.168.50.1:3000/api/sync/cleanup \
  -H "Content-Type: application/json" \
  -d '{"days":7}'
```

**Response:**
```json
{
  "success": true,
  "deleted_count": 156
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters, invalid input)
- `404` - Not Found (device, screenshot, etc.)
- `500` - Internal Server Error (libimobiledevice errors, database errors)

---

## Mobile App Integration

### API Client Configuration

```javascript
// Detect connection mode
const API_BASE_URL = isConnectedToAP()
  ? 'http://192.168.50.1:3000'  // AP mode
  : 'https://api.yourdomain.com'; // Online mode

// Make request
fetch(`${API_BASE_URL}/api/device/info`)
  .then(res => res.json())
  .then(data => console.log(data));
```

### Connection Mode Detection

```javascript
// React Native example using NetInfo
import NetInfo from '@react-native-community/netinfo';

NetInfo.fetch().then(state => {
  if (state.details && state.details.ssid === 'RaspberryPi-iOS') {
    // Connected to Pi AP - use local API
    setApiMode('offline');
  } else if (state.isConnected && state.isInternetReachable) {
    // Connected to internet - use backend API
    setApiMode('online');
  } else {
    // Completely offline - use local cache
    setApiMode('cache');
  }
});
```

---

## Testing

### Quick Tests

```bash
# Health check
curl http://192.168.50.1:3000/health

# List devices
curl http://192.168.50.1:3000/api/device/list

# Get device info
curl http://192.168.50.1:3000/api/device/info | jq

# Get battery
curl http://192.168.50.1:3000/api/battery | jq

# Capture screenshot
curl http://192.168.50.1:3000/api/screenshot > test.png && open test.png

# Stream logs (press Ctrl+C to stop)
curl -N http://192.168.50.1:3000/api/syslog/stream
```

### Full Test Script

```bash
#!/bin/bash
# test-pi-api.sh

API_URL="http://192.168.50.1:3000"

echo "Testing Pi API..."

# Health check
echo "1. Health check..."
curl -s $API_URL/health | jq

# List devices
echo "2. List devices..."
DEVICES=$(curl -s $API_URL/api/device/list | jq -r '.devices[]')
echo "Found devices: $DEVICES"

if [ -z "$DEVICES" ]; then
  echo "No devices connected. Plug in an iPhone."
  exit 1
fi

UDID=$(echo "$DEVICES" | head -1)
echo "Using device: $UDID"

# Device info
echo "3. Device info..."
curl -s "$API_URL/api/device/info?udid=$UDID" | jq

# Battery
echo "4. Battery status..."
curl -s "$API_URL/api/battery?udid=$UDID" | jq

# Screenshot
echo "5. Screenshot..."
curl -s "$API_URL/api/screenshot?udid=$UDID" > screenshot_test.png
echo "Screenshot saved to screenshot_test.png"

# Sync status
echo "6. Sync status..."
curl -s $API_URL/api/sync/status | jq

echo "All tests completed!"
```

---

## Next Steps

- Connect mobile app to Pi API
- Test offline data collection
- Configure backend sync
- Review [WiFi Modes Guide](../hardware/wifi-modes.md)
