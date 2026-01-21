#!/usr/bin/env node
/**
 * Initialize SQLite database
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'pi-bridge.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

console.log('Initializing database...');
console.log('Database path:', DB_PATH);

// Read schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Create database
const db = new Database(DB_PATH);

// Execute schema
db.exec(schema);

console.log('Database initialized successfully!');
console.log('Tables created:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => console.log(`  - ${table.name}`));

db.close();
