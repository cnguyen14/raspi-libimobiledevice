/**
 * Battery information endpoints
 */

const express = require('express');
const router = express.Router();
const libimobiledevice = require('../services/libimobiledevice');
const storage = require('../services/storage');

/**
 * GET /api/battery
 * Get current battery status
 */
router.get('/', async (req, res) => {
  try {
    const udid = req.query.udid || null;
    const batteryInfo = await libimobiledevice.getBatteryInfo(udid);

    // Save to database
    if (udid || batteryInfo.level !== undefined) {
      const deviceUdid = udid || (await libimobiledevice.listDevices())[0];
      const state = batteryInfo.is_charging ? 'charging' : 'discharging';
      storage.saveBatteryStatus(deviceUdid, batteryInfo.level, state);
    }

    res.json({
      success: true,
      battery: batteryInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/battery/history
 * Get battery status history
 */
router.get('/history', (req, res) => {
  try {
    const udid = req.query.udid;
    const hours = parseInt(req.query.hours) || 24;

    if (!udid) {
      return res.status(400).json({
        success: false,
        error: 'UDID parameter required'
      });
    }

    const history = storage.getBatteryHistory(udid, hours);

    res.json({
      success: true,
      count: history.length,
      history: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
