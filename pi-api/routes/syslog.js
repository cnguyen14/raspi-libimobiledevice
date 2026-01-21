/**
 * System log streaming endpoints
 */

const express = require('express');
const router = express.Router();
const libimobiledevice = require('../services/libimobiledevice');
const storage = require('../services/storage');

/**
 * GET /api/syslog/stream
 * Stream system logs (Server-Sent Events)
 */
router.get('/stream', async (req, res) => {
  const udid = req.query.udid || null;

  try {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Start syslog process
    const syslogProcess = libimobiledevice.startSyslog(udid);

    // Get device UDID for storage
    const deviceUdid = udid || (await libimobiledevice.listDevices())[0];

    // Stream logs to client
    syslogProcess.stdout.on('data', (data) => {
      const logLines = data.toString().split('\n').filter(line => line.length > 0);

      logLines.forEach(line => {
        // Send to client
        res.write(`data: ${JSON.stringify({ log: line, timestamp: new Date().toISOString() })}\n\n`);

        // Save to database
        if (deviceUdid) {
          try {
            storage.saveLogEntry(deviceUdid, line);
          } catch (err) {
            console.error('Failed to save log entry:', err);
          }
        }
      });
    });

    syslogProcess.stderr.on('data', (data) => {
      console.error('Syslog error:', data.toString());
    });

    syslogProcess.on('close', (code) => {
      console.log('Syslog process closed with code:', code);
      res.end();
    });

    // Cleanup on client disconnect
    req.on('close', () => {
      syslogProcess.kill();
      res.end();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/syslog/history
 * Get stored system logs
 */
router.get('/history', (req, res) => {
  try {
    const udid = req.query.udid;
    const limit = parseInt(req.query.limit) || 100;

    if (!udid) {
      return res.status(400).json({
        success: false,
        error: 'UDID parameter required'
      });
    }

    const logs = storage.getLogEntries(udid, limit);

    res.json({
      success: true,
      count: logs.length,
      logs: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
