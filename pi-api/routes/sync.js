/**
 * Data synchronization endpoints
 */

const express = require('express');
const router = express.Router();
const syncQueue = require('../services/sync-queue');
const storage = require('../services/storage');

/**
 * POST /api/sync/trigger
 * Manually trigger sync to backend
 */
router.post('/trigger', async (req, res) => {
  try {
    const results = await syncQueue.processQueue();

    res.json({
      success: true,
      sync_results: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sync/status
 * Get sync queue status
 */
router.get('/status', (req, res) => {
  try {
    const stats = syncQueue.getStats();
    const pending = syncQueue.getPending(10); // Get first 10 pending

    res.json({
      success: true,
      statistics: stats,
      pending_operations: pending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sync/unsynced
 * Get unsynced records by type
 */
router.get('/unsynced', (req, res) => {
  try {
    const dataType = req.query.type; // screenshot, log, battery

    if (!dataType) {
      return res.status(400).json({
        success: false,
        error: 'Type parameter required (screenshot, log, battery)'
      });
    }

    const records = storage.getUnsyncedRecords(dataType);

    res.json({
      success: true,
      data_type: dataType,
      count: records.length,
      records: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sync/mark-synced
 * Mark records as synced (called by backend after successful sync)
 */
router.post('/mark-synced', (req, res) => {
  try {
    const { data_type, ids } = req.body;

    if (!data_type || !ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameters. Required: data_type (string), ids (array)'
      });
    }

    storage.markAsSynced(data_type, ids);

    res.json({
      success: true,
      message: `Marked ${ids.length} ${data_type} records as synced`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sync/cleanup
 * Clean up old completed sync operations
 */
router.post('/cleanup', (req, res) => {
  try {
    const days = parseInt(req.body.days) || 7;
    const deleted = syncQueue.cleanup(days);

    res.json({
      success: true,
      deleted_count: deleted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
