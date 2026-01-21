# Kiosk Deployment Examples

This directory contains example files for setting up CI/CD deployment to your Raspberry Pi kiosk.

## Files

### `github-workflow.yml`

Complete GitHub Actions workflow for automatic deployment.

**Usage:**
1. Copy this file to `.github/workflows/deploy.yml` in your repository
2. Configure GitHub Secrets (see below)
3. Adjust the `source` parameter based on your build output:
   - Vite/React: `dist/*`
   - Next.js: `out/*`
   - Create React App: `build/*`

**Required GitHub Secrets:**

Navigate to your repository → Settings → Secrets and variables → Actions

| Secret Name | Value | Example |
|-------------|-------|---------|
| `PI_HOST` | Your Raspberry Pi IP address | `192.168.1.137` |
| `PI_USER` | SSH username | `pi` |
| `PI_PASSWORD` | SSH password | `root` |
| `PI_PORT` | SSH port | `22` |

### `test-page.html`

Beautiful test page to verify kiosk functionality.

**Features:**
- Live clock and date
- Uptime counter
- Responsive design
- Gradient background
- Auto-refreshing display

**Usage:**

**Option 1: Quick Test (Manual)**
```bash
# Copy to Pi
scp test-page.html pi@192.168.1.137:/home/pi/app/index.html

# Refresh browser
ssh pi@192.168.1.137 "export DISPLAY=:0 && xdotool key F5"
```

**Option 2: As Your First Deployment**
1. Create a simple repository with just this file
2. Add a basic `package.json`:
   ```json
   {
     "name": "kiosk-test",
     "version": "1.0.0",
     "scripts": {
       "build": "mkdir -p dist && cp test-page.html dist/index.html"
     }
   }
   ```
3. Set up GitHub Actions with the workflow above
4. Push to trigger deployment

## Quick Start Guide

### 1. Set Up Your Repository

For a static site:
```bash
mkdir my-kiosk-app
cd my-kiosk-app
git init

# Copy test page
cp path/to/test-page.html index.html

# Create package.json
cat > package.json <<EOF
{
  "name": "my-kiosk-app",
  "version": "1.0.0",
  "scripts": {
    "build": "mkdir -p dist && cp index.html dist/"
  }
}
EOF

# Add GitHub Actions workflow
mkdir -p .github/workflows
cp path/to/github-workflow.yml .github/workflows/deploy.yml
```

### 2. Configure GitHub

```bash
# Create GitHub repository
gh repo create my-kiosk-app --public --source=. --remote=origin

# Add secrets
gh secret set PI_HOST --body "192.168.1.137"
gh secret set PI_USER --body "pi"
gh secret set PI_PASSWORD --body "root"
gh secret set PI_PORT --body "22"
```

### 3. Deploy

```bash
git add .
git commit -m "Initial kiosk setup"
git push -u origin main
```

Watch deployment: `https://github.com/YOUR-USERNAME/my-kiosk-app/actions`

## Framework-Specific Examples

### React + Vite

```yaml
# In github-workflow.yml, build step:
- name: Build application
  run: npm run build  # Creates dist/ folder

# In deploy step:
source: "dist/*"
```

### Next.js (Static Export)

```javascript
// next.config.js
module.exports = {
  output: 'export',  // Enable static export
};
```

```yaml
# In github-workflow.yml:
- name: Build application
  run: npm run build  # Creates out/ folder

# In deploy step:
source: "out/*"
```

### Create React App

```yaml
# In github-workflow.yml:
- name: Build application
  run: npm run build  # Creates build/ folder

# In deploy step:
source: "build/*"
```

## Testing Your Deployment

### 1. Test Manual Deployment

```bash
# SSH to Pi and check PM2
ssh pi@192.168.1.137
pm2 status
pm2 logs kiosk-app

# Test web server
curl http://localhost:3000
```

### 2. Test Browser Refresh

```bash
# Send F5 key to Chromium
ssh pi@192.168.1.137 "export DISPLAY=:0 && xdotool search --class chromium windowactivate --sync key --clearmodifiers F5"
```

### 3. Test Full Deployment

1. Make a change to your HTML/code
2. Commit and push to GitHub
3. Go to Actions tab in GitHub
4. Watch the workflow run
5. Check the Pi display for updated content

## Troubleshooting

### Deployment Fails at SCP Step

**Error:** `Permission denied` or `Connection refused`

**Solution:**
1. Verify GitHub secrets are correct
2. Test SSH manually: `ssh pi@192.168.1.137`
3. Check Pi is on network: `ping 192.168.1.137`

### Files Deploy But Don't Update

**Symptom:** Old content still visible after deployment

**Solution:**
1. Check files actually copied:
   ```bash
   ssh pi@192.168.1.137 "ls -la /home/pi/app/"
   ```

2. Restart PM2:
   ```bash
   ssh pi@192.168.1.137 "pm2 restart kiosk-app"
   ```

3. Force browser refresh:
   ```bash
   ssh pi@192.168.1.137 "export DISPLAY=:0 && xdotool key Ctrl+Shift+R"
   ```

### Browser Not Refreshing

**Symptom:** Workflow succeeds but browser doesn't refresh

**Solution:**
1. Check X is running:
   ```bash
   ssh pi@192.168.1.137 "ps aux | grep X"
   ```

2. Verify xdotool installed:
   ```bash
   ssh pi@192.168.1.137 "which xdotool"
   ```

3. Test xdotool manually:
   ```bash
   ssh pi@192.168.1.137 "export DISPLAY=:0 && xdotool search --class chromium"
   ```

## Advanced: Multiple Environments

To deploy different content to different Pis:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches:
      - staging

jobs:
  deploy:
    # ... same steps but use different secrets:
    host: ${{ secrets.PI_STAGING_HOST }}
```

Then add staging secrets:
- `PI_STAGING_HOST`
- `PI_STAGING_USER`
- etc.

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Complete Setup Guide](../docs/KIOSK_SETUP.md)
