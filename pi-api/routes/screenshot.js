/**
 * Screenshot capture endpoints
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const libimobiledevice = require('../services/libimobiledevice');
const storage = require('../services/storage');

// Screenshots directory
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * GET /api/screenshot
 * Capture a screenshot
 */
router.get('/', async (req, res) => {
  try {
    const udid = req.query.udid || null;

    // Get device UDID if not provided
    const deviceUdid = udid || (await libimobiledevice.listDevices())[0];

    if (!deviceUdid) {
      return res.status(404).json({
        success: false,
        error: 'No device connected'
      });
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = `screenshot_${deviceUdid}_${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    // Capture screenshot
    await libimobiledevice.captureScreenshot(filepath, udid);

    // Save metadata to database
    const screenshotId = storage.saveScreenshot(deviceUdid, filename, filepath);

    // Send file
    res.sendFile(filepath);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/screenshot/list
 * List captured screenshots
 */
router.get('/list', (req, res) => {
  try {
    const udid = req.query.udid;
    const limit = parseInt(req.query.limit) || 50;

    if (!udid) {
      return res.status(400).json({
        success: false,
        error: 'UDID parameter required'
      });
    }

    const screenshots = storage.getScreenshots(udid, limit);

    res.json({
      success: true,
      count: screenshots.length,
      screenshots: screenshots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/screenshot/:id
 * Get a specific screenshot by ID
 */
router.get('/:id', (req, res) => {
  try {
    const db = storage.connect();
    const screenshot = db.prepare('SELECT * FROM screenshots WHERE id = ?').get(req.params.id);

    if (!screenshot) {
      return res.status(404).json({
        success: false,
        error: 'Screenshot not found'
      });
    }

    if (!fs.existsSync(screenshot.filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Screenshot file not found'
      });
    }

    res.sendFile(screenshot.filepath);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
