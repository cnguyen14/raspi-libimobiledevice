/**
 * Sync queue service for managing offline operations
 */

const Database = require('better-sqlite3');
const path = require('path');
const axios = require('axios');

const DB_PATH = path.join(__dirname, '../db/pi-bridge.db');
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.yourdomain.com';

class SyncQueueService {
  constructor() {
    this.db = null;
    this.isSyncing = false;
  }

  connect() {
    if (!this.db) {
      this.db = new Database(DB_PATH);
    }
    return this.db;
  }

  /**
   * Add operation to sync queue
   */
  enqueue(operationType, dataType, recordId, payload) {
    const db = this.connect();

    const stmt = db.prepare(`
      INSERT INTO sync_queue (operation_type, data_type, record_id, payload)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      operationType,
      dataType,
      recordId,
      JSON.stringify(payload)
    );

    return result.lastInsertRowid;
  }

  /**
   * Get pending sync operations
   */
  getPending(limit = 50) {
    const db = this.connect();
    return db.prepare(`
      SELECT * FROM sync_queue
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ?
    `).all(limit);
  }

  /**
   * Update operation status
   */
  updateStatus(id, status, errorMessage = null) {
    const db = this.connect();

    const stmt = db.prepare(`
      UPDATE sync_queue
      SET status = ?,
          attempts = attempts + 1,
          last_attempt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(status, id);
  }

  /**
   * Process sync queue - send pending operations to backend
   */
  async processQueue() {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return { status: 'in_progress' };
    }

    this.isSyncing = true;
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    try {
      const pending = this.getPending();
      console.log(`Processing ${pending.length} pending sync operations`);

      for (const operation of pending) {
        results.processed++;

        try {
          // Mark as processing
          this.updateStatus(operation.id, 'processing');

          // Send to backend
          const payload = JSON.parse(operation.payload);
          const response = await axios.post(
            `${BACKEND_URL}/api/v1/sync`,
            {
              operation_type: operation.operation_type,
              data_type: operation.data_type,
              record_id: operation.record_id,
              payload: payload,
              pi_timestamp: operation.created_at
            },
            {
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json',
                'X-Pi-ID': process.env.PI_ID || 'pi-default'
              }
            }
          );

          if (response.status === 200) {
            this.updateStatus(operation.id, 'completed');
            results.succeeded++;
          } else {
            throw new Error(`Unexpected status: ${response.status}`);
          }
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error.message);

          // Retry logic: fail after 5 attempts
          if (operation.attempts >= 4) {
            this.updateStatus(operation.id, 'failed');
          } else {
            this.updateStatus(operation.id, 'pending');
          }

          results.failed++;
          results.errors.push({
            operation_id: operation.id,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
      results.errors.push({ error: error.message });
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  /**
   * Clear completed operations older than N days
   */
  cleanup(days = 7) {
    const db = this.connect();

    const stmt = db.prepare(`
      DELETE FROM sync_queue
      WHERE status = 'completed'
        AND created_at < datetime('now', '-${days} days')
    `);

    const result = stmt.run();
    return result.changes;
  }

  /**
   * Get sync statistics
   */
  getStats() {
    const db = this.connect();

    const stats = {};

    // Count by status
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM sync_queue
      GROUP BY status
    `).all();

    statusCounts.forEach(row => {
      stats[row.status] = row.count;
    });

    // Last successful sync
    const lastSync = db.prepare(`
      SELECT MAX(last_attempt) as last_sync
      FROM sync_queue
      WHERE status = 'completed'
    `).get();

    stats.last_successful_sync = lastSync.last_sync;

    return stats;
  }
}

module.exports = new SyncQueueService();
