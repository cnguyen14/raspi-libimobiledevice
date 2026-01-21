/**
 * libimobiledevice wrapper service
 * Executes idevice commands and parses output
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class LibimobiledeviceService {
  /**
   * Get list of connected device UDIDs
   */
  async listDevices() {
    try {
      const { stdout } = await execAsync('idevice_id -l');
      const udids = stdout.trim().split('\n').filter(line => line.length > 0);
      return udids;
    } catch (error) {
      if (error.stdout === '') {
        return []; // No devices connected
      }
      throw new Error(`Failed to list devices: ${error.message}`);
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(udid = null) {
    try {
      const cmd = udid ? `ideviceinfo -u ${udid}` : 'ideviceinfo';
      const { stdout } = await execAsync(cmd);

      // Parse ideviceinfo output (key: value format)
      const info = {};
      stdout.split('\n').forEach(line => {
        const match = line.match(/^(.+?):\s*(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          info[key] = value;
        }
      });

      return {
        udid: info.UniqueDeviceID,
        name: info.DeviceName,
        model: info.ProductType,
        ios_version: info.ProductVersion,
        serial_number: info.SerialNumber,
        wifi_address: info.WiFiAddress,
        bluetooth_address: info.BluetoothAddress,
        raw: info
      };
    } catch (error) {
      throw new Error(`Failed to get device info: ${error.message}`);
    }
  }

  /**
   * Get device name
   */
  async getDeviceName(udid = null) {
    try {
      const cmd = udid ? `idevicename -u ${udid}` : 'idevicename';
      const { stdout } = await execAsync(cmd);
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get device name: ${error.message}`);
    }
  }

  /**
   * Get battery information
   */
  async getBatteryInfo(udid = null) {
    try {
      const cmd = udid
        ? `ideviceinfo -u ${udid} -q com.apple.mobile.battery`
        : 'ideviceinfo -q com.apple.mobile.battery';

      const { stdout } = await execAsync(cmd);

      // Parse battery info
      const info = {};
      stdout.split('\n').forEach(line => {
        const match = line.match(/^(.+?):\s*(.+)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          info[key] = value;
        }
      });

      return {
        level: parseInt(info.BatteryCurrentCapacity || 0),
        is_charging: info.BatteryIsCharging === 'true',
        external_connected: info.ExternalConnected === 'true',
        external_charge_capable: info.ExternalChargeCapable === 'true',
        raw: info
      };
    } catch (error) {
      throw new Error(`Failed to get battery info: ${error.message}`);
    }
  }

  /**
   * Capture screenshot
   */
  async captureScreenshot(outputPath, udid = null) {
    try {
      const cmd = udid
        ? `idevicescreenshot -u ${udid} ${outputPath}`
        : `idevicescreenshot ${outputPath}`;

      await execAsync(cmd);
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to capture screenshot: ${error.message}`);
    }
  }

  /**
   * Check pairing status
   */
  async checkPairing(udid = null) {
    try {
      const cmd = udid ? `idevicepair -u ${udid} validate` : 'idevicepair validate';
      const { stdout } = await execAsync(cmd);
      return stdout.includes('SUCCESS');
    } catch (error) {
      return false;
    }
  }

  /**
   * Start system log stream
   * Returns a child process that streams logs
   */
  startSyslog(udid = null) {
    const cmd = udid ? `idevicesyslog -u ${udid}` : 'idevicesyslog';
    return exec(cmd);
  }
}

module.exports = new LibimobiledeviceService();
