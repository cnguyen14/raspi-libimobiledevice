/**
 * Device information endpoints
 */

const express = require('express');
const router = express.Router();
const libimobiledevice = require('../services/libimobiledevice');
const storage = require('../services/storage');

/**
 * GET /api/device/list
 * List all connected devices
 */
router.get('/list', async (req, res) => {
  try {
    const udids = await libimobiledevice.listDevices();

    res.json({
      success: true,
      count: udids.length,
      devices: udids
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/device/info
 * Get detailed device information
 */
router.get('/info', async (req, res) => {
  try {
    const udid = req.query.udid || null;
    const deviceInfo = await libimobiledevice.getDeviceInfo(udid);

    // Save to database
    storage.saveDevice(deviceInfo);

    res.json({
      success: true,
      device: deviceInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/device/name
 * Get device name
 */
router.get('/name', async (req, res) => {
  try {
    const udid = req.query.udid || null;
    const name = await libimobiledevice.getDeviceName(udid);

    res.json({
      success: true,
      name: name
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/device/pairing
 * Check device pairing status
 */
router.get('/pairing', async (req, res) => {
  try {
    const udid = req.query.udid || null;
    const isPaired = await libimobiledevice.checkPairing(udid);

    res.json({
      success: true,
      paired: isPaired
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/device/history
 * Get device connection history from database
 */
router.get('/history', (req, res) => {
  try {
    const devices = storage.getAllDevices();

    res.json({
      success: true,
      count: devices.length,
      devices: devices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
