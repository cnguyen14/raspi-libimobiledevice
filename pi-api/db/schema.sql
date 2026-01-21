-- Raspberry Pi iOS Bridge Local Database Schema
-- SQLite database for offline data storage

-- Devices table - stores connected iOS device information
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    udid TEXT UNIQUE NOT NULL,
    name TEXT,
    model TEXT,
    ios_version TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0
);

-- Screenshots table - stores screenshot metadata
CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_udid TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (device_udid) REFERENCES devices(udid)
);

-- System logs table - stores device system logs
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_udid TEXT NOT NULL,
    log_entry TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (device_udid) REFERENCES devices(udid)
);

-- Battery status history
CREATE TABLE IF NOT EXISTS battery_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_udid TEXT NOT NULL,
    level INTEGER,
    state TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT 0,
    FOREIGN KEY (device_udid) REFERENCES devices(udid)
);

-- Sync queue - operations waiting to sync to backend
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL, -- 'create', 'update', 'delete'
    data_type TEXT NOT NULL, -- 'device', 'screenshot', 'log', 'battery'
    record_id INTEGER NOT NULL,
    payload TEXT, -- JSON payload
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    last_attempt DATETIME,
    status TEXT DEFAULT 'pending' -- 'pending', 'processing', 'failed', 'completed'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_devices_udid ON devices(udid);
CREATE INDEX IF NOT EXISTS idx_screenshots_device ON screenshots(device_udid);
CREATE INDEX IF NOT EXISTS idx_screenshots_synced ON screenshots(synced);
CREATE INDEX IF NOT EXISTS idx_logs_device ON system_logs(device_udid);
CREATE INDEX IF NOT EXISTS idx_logs_synced ON system_logs(synced);
CREATE INDEX IF NOT EXISTS idx_battery_device ON battery_history(device_udid);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
