/**
 * Local SQLite storage service
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../db/pi-bridge.db');

class StorageService {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  connect() {
    if (!this.db) {
      this.db = new Database(DB_PATH);
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    }
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Save or update device information
   */
  saveDevice(deviceInfo) {
    const db = this.connect();

    const stmt = db.prepare(`
      INSERT INTO devices (udid, name, model, ios_version, last_seen)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(udid) DO UPDATE SET
        name = excluded.name,
        model = excluded.model,
        ios_version = excluded.ios_version,
        last_seen = CURRENT_TIMESTAMP
    `);

    stmt.run(deviceInfo.udid, deviceInfo.name, deviceInfo.model, deviceInfo.ios_version);

    return this.getDevice(deviceInfo.udid);
  }

  /**
   * Get device by UDID
   */
  getDevice(udid) {
    const db = this.connect();
    return db.prepare('SELECT * FROM devices WHERE udid = ?').get(udid);
  }

  /**
   * Get all devices
   */
  getAllDevices() {
    const db = this.connect();
    return db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
  }

  /**
   * Save screenshot metadata
   */
  saveScreenshot(udid, filename, filepath) {
    const db = this.connect();

    const stmt = db.prepare(`
      INSERT INTO screenshots (device_udid, filename, filepath)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(udid, filename, filepath);
    return result.lastInsertRowid;
  }

  /**
   * Get screenshots for a device
   */
  getScreenshots(udid, limit = 50) {
    const db = this.connect();
    return db.prepare(`
      SELECT * FROM screenshots
      WHERE device_udid = ?
      ORDER BY captured_at DESC
      LIMIT ?
    `).all(udid, limit);
  }

  /**
   * Save battery status
   */
  saveBatteryStatus(udid, level, state) {
    const db = this.connect();

    const stmt = db.prepare(`
      INSERT INTO battery_history (device_udid, level, state)
      VALUES (?, ?, ?)
    `);

    stmt.run(udid, level, state);
  }

  /**
   * Get battery history
   */
  getBatteryHistory(udid, hours = 24) {
    const db = this.connect();
    return db.prepare(`
      SELECT * FROM battery_history
      WHERE device_udid = ?
        AND timestamp >= datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `).all(udid);
  }

  /**
   * Save system log entry
   */
  saveLogEntry(udid, logEntry) {
    const db = this.connect();

    const stmt = db.prepare(`
      INSERT INTO system_logs (device_udid, log_entry)
      VALUES (?, ?)
    `);

    stmt.run(udid, logEntry);
  }

  /**
   * Get log entries
   */
  getLogEntries(udid, limit = 100) {
    const db = this.connect();
    return db.prepare(`
      SELECT * FROM system_logs
      WHERE device_udid = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(udid, limit);
  }

  /**
   * Get unsynced records
   */
  getUnsyncedRecords(dataType) {
    const db = this.connect();
    const table = {
      'screenshot': 'screenshots',
      'log': 'system_logs',
      'battery': 'battery_history'
    }[dataType];

    if (!table) {
      throw new Error('Invalid data type');
    }

    return db.prepare(`SELECT * FROM ${table} WHERE synced = 0 ORDER BY id`).all();
  }

  /**
   * Mark records as synced
   */
  markAsSynced(dataType, ids) {
    const db = this.connect();
    const table = {
      'screenshot': 'screenshots',
      'log': 'system_logs',
      'battery': 'battery_history',
      'device': 'devices'
    }[dataType];

    if (!table) {
      throw new Error('Invalid data type');
    }

    const placeholders = ids.map(() => '?').join(',');
    const stmt = db.prepare(`UPDATE ${table} SET synced = 1 WHERE id IN (${placeholders})`);
    stmt.run(...ids);
  }
}

module.exports = new StorageService();
