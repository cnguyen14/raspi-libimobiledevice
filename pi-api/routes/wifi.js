/**
 * WiFi Management Routes
 * Handles WiFi mode switching (AP/Client) and network scanning
 */

const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;

const router = express.Router();
const execAsync = promisify(exec);

// Configuration files
const CONFIG = {
  CURRENT_MODE_FILE: '/tmp/wifi-mode.txt',
  NETWORK_SCRIPT_DIR: '/home/pi/raspi-ios-bridge/pi-setup/network',
  WPA_SUPPLICANT_CONF: '/etc/wpa_supplicant/wpa_supplicant.conf',
  HOSTAPD_CONF: '/etc/hostapd/hostapd.conf',
};

/**
 * GET /api/wifi/status
 * Get current WiFi mode and connection status
 */
router.get('/status', async (req, res) => {
  try {
    // Get current mode from file or detect from services
    let mode = 'unknown';
    try {
      mode = await fs.readFile(CONFIG.CURRENT_MODE_FILE, 'utf-8');
      mode = mode.trim();
    } catch (err) {
      // File doesn't exist, detect from services
      const { stdout: hostapdStatus } = await execAsync('systemctl is-active hostapd || echo inactive');
      if (hostapdStatus.trim() === 'active') {
        mode = 'ap';
      } else {
        mode = 'client';
      }
    }

    // Get interface status
    const { stdout: ifconfig } = await execAsync('ip addr show wlan0');
    const ipMatch = ifconfig.match(/inet (\d+\.\d+\.\d+\.\d+)/);
    const ipAddress = ipMatch ? ipMatch[1] : null;

    // Get connected SSID (if in client mode)
    let connectedSsid = null;
    if (mode === 'client') {
      try {
        const { stdout: ssidOutput } = await execAsync('iwgetid -r');
        connectedSsid = ssidOutput.trim() || null;
      } catch (err) {
        // Not connected
      }
    }

    res.json({
      success: true,
      mode,
      ipAddress,
      connectedSsid,
      interface: 'wlan0',
    });
  } catch (error) {
    console.error('Error getting WiFi status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WiFi status',
      message: error.message,
    });
  }
});

/**
 * GET /api/wifi/scan
 * Scan for available WiFi networks
 */
router.get('/scan', async (req, res) => {
  try {
    // Trigger scan
    await execAsync('sudo iwlist wlan0 scan');

    // Parse scan results
    const { stdout: scanOutput } = await execAsync('sudo iwlist wlan0 scan | grep -E "ESSID|Quality|Encryption"');

    // Parse the output into structured data
    const networks = [];
    const lines = scanOutput.split('\n');
    let currentNetwork = {};

    for (const line of lines) {
      if (line.includes('Quality=')) {
        const qualityMatch = line.match(/Quality=(\d+)\/(\d+)/);
        const signalMatch = line.match(/Signal level=(-?\d+)/);
        if (qualityMatch) {
          currentNetwork.quality = parseInt(qualityMatch[1]);
          currentNetwork.maxQuality = parseInt(qualityMatch[2]);
          currentNetwork.qualityPercent = Math.round((currentNetwork.quality / currentNetwork.maxQuality) * 100);
        }
        if (signalMatch) {
          currentNetwork.signalLevel = parseInt(signalMatch[1]);
        }
      } else if (line.includes('Encryption key:')) {
        currentNetwork.encrypted = line.includes('on');
      } else if (line.includes('ESSID:')) {
        const ssidMatch = line.match(/ESSID:"([^"]*)"/);
        if (ssidMatch && ssidMatch[1]) {
          currentNetwork.ssid = ssidMatch[1];
          if (currentNetwork.ssid) {
            networks.push({ ...currentNetwork });
          }
          currentNetwork = {};
        }
      }
    }

    // Remove duplicates and sort by signal strength
    const uniqueNetworks = networks.reduce((acc, network) => {
      const existing = acc.find(n => n.ssid === network.ssid);
      if (!existing || network.qualityPercent > existing.qualityPercent) {
        return [...acc.filter(n => n.ssid !== network.ssid), network];
      }
      return acc;
    }, []);

    uniqueNetworks.sort((a, b) => b.qualityPercent - a.qualityPercent);

    res.json({
      success: true,
      networks: uniqueNetworks,
      count: uniqueNetworks.length,
    });
  } catch (error) {
    console.error('Error scanning WiFi:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan WiFi networks',
      message: error.message,
    });
  }
});

/**
 * POST /api/wifi/mode/ap
 * Switch to AP mode (offline hotspot)
 */
router.post('/mode/ap', async (req, res) => {
  try {
    console.log('Switching to AP mode...');

    // Execute switch script
    const { stdout, stderr } = await execAsync(
      `sudo ${CONFIG.NETWORK_SCRIPT_DIR}/switch-mode.sh ap`
    );

    // Save current mode
    await fs.writeFile(CONFIG.CURRENT_MODE_FILE, 'ap');

    res.json({
      success: true,
      mode: 'ap',
      message: 'Switched to AP mode. Pi will create WiFi hotspot "RaspberryPi-iOS"',
      output: stdout,
      warning: 'SSH connection may be lost. Reconnect to 192.168.50.1',
    });
  } catch (error) {
    console.error('Error switching to AP mode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch to AP mode',
      message: error.message,
    });
  }
});

/**
 * POST /api/wifi/mode/client
 * Switch to Client mode and connect to a network
 * Body: { ssid: string, password: string }
 */
router.post('/mode/client', async (req, res) => {
  try {
    const { ssid, password } = req.body;

    if (!ssid || !password) {
      return res.status(400).json({
        success: false,
        error: 'SSID and password are required',
      });
    }

    console.log(`Switching to Client mode, connecting to: ${ssid}`);

    // First, setup client mode with credentials
    const { stdout: setupOutput } = await execAsync(
      `sudo ${CONFIG.NETWORK_SCRIPT_DIR}/setup-client-mode.sh "${ssid}" "${password}"`
    );

    // Then switch to client mode
    const { stdout: switchOutput } = await execAsync(
      `sudo ${CONFIG.NETWORK_SCRIPT_DIR}/switch-mode.sh client`
    );

    // Save current mode
    await fs.writeFile(CONFIG.CURRENT_MODE_FILE, 'client');

    res.json({
      success: true,
      mode: 'client',
      ssid,
      message: `Switching to Client mode and connecting to ${ssid}`,
      output: switchOutput,
      warning: 'SSH connection may be lost temporarily. Pi will get new IP from DHCP.',
    });
  } catch (error) {
    console.error('Error switching to Client mode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch to Client mode',
      message: error.message,
    });
  }
});

/**
 * GET /api/wifi/saved-networks
 * Get list of saved WiFi networks from wpa_supplicant
 */
router.get('/saved-networks', async (req, res) => {
  try {
    const { stdout } = await execAsync(`sudo grep -E "^[[:space:]]*ssid=" ${CONFIG.WPA_SUPPLICANT_CONF} || echo ""`);

    const networks = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/ssid="([^"]*)"/);
        return match ? match[1] : null;
      })
      .filter(ssid => ssid);

    res.json({
      success: true,
      networks,
      count: networks.length,
    });
  } catch (error) {
    console.error('Error getting saved networks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get saved networks',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/wifi/saved-networks/:ssid
 * Remove a saved network from wpa_supplicant
 */
router.delete('/saved-networks/:ssid', async (req, res) => {
  try {
    const { ssid } = req.params;

    // This is a placeholder - proper implementation would need to parse and edit wpa_supplicant.conf
    // For now, just return success
    res.json({
      success: true,
      message: `Network ${ssid} removal requested`,
      warning: 'Manual removal from wpa_supplicant.conf may be required',
    });
  } catch (error) {
    console.error('Error removing saved network:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove saved network',
      message: error.message,
    });
  }
});

module.exports = router;
