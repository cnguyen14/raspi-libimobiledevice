#!/usr/bin/env node
/**
 * Raspberry Pi iOS Bridge API Server
 * Provides REST API for iOS device communication via libimobiledevice
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const deviceRoutes = require('./routes/device');
const screenshotRoutes = require('./routes/screenshot');
const syslogRoutes = require('./routes/syslog');
const batteryRoutes = require('./routes/battery');
const syncRoutes = require('./routes/sync');
const wifiRoutes = require('./routes/wifi');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for mobile app access
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/device', deviceRoutes);
app.use('/api/screenshot', screenshotRoutes);
app.use('/api/syslog', syslogRoutes);
app.use('/api/battery', batteryRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/wifi', wifiRoutes);

// Serve static files (kiosk app from Vite build)
app.use(express.static(path.join(__dirname, '../kiosk-app/dist')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Raspberry Pi iOS Bridge API',
    version: '1.0.0',
    endpoints: {
      device: '/api/device/info',
      battery: '/api/battery',
      screenshot: '/api/screenshot',
      syslog: '/api/syslog',
      sync: '/api/sync'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('Raspberry Pi iOS Bridge API Server');
  console.log('========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`WiFi Settings: http://localhost:${PORT}/wifi-settings.html`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
