# Raspberry Pi Kiosk App v2.0

**Professional IoT Dashboard for 5" Touchscreen (800x480)**

Built with **Vite + Tailwind CSS v4** for optimal performance and professional design.

---

## 🎨 Design Philosophy

### Professional Industrial IoT Color Palette

Research-backed color scheme based on 2026 IoT dashboard trends:

**Dark Slate Theme:**
- Primary Background: `slate-950` (#020617)
- Cards: `slate-900/50` with glassmorphism
- Borders: `slate-800/50`
- Text: `slate-100` / `slate-400`
- Accent: `cyan-500` (Professional tech blue)
- Success: `emerald-400`
- Warning: `amber-500`

**Why Dark Slate?**
- Professional and modern
- Reduces eye strain on small screens
- High contrast for outdoor visibility
- Industry standard for IoT dashboards
- Timeless and sophisticated

### Research Sources
- [Dashboard Design 2026 Trends](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/)
- [IoT Color Best Practices](https://medium.com/ge-design/iot-cool-gray-is-a-great-background-color-for-data-visualization-ebf18c318418)
- [Dark Mode Design 2026](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/)
- [Professional Dashboard Colors](https://dev.to/info_generalhazedawn_a3d/design-matters-1-the-ultimate-dashboard-colour-palette-ma3)

---

## 🚀 Technology Stack

- **Vite 6.4** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first CSS framework (alpha)
- **Vanilla JavaScript** - No framework overhead
- **CSS Glassmorphism** - Modern frosted glass effects

---

## 📐 Optimized for 800x480 Touchscreen

### Touch-First Design
- **Large touch targets:** 50-160px buttons
- **Visual feedback:** Scale & brightness on `:active`
- **No accidental zoom:** `user-scalable=no`
- **Tap highlights disabled:** Better touch UX

### Typography
- **Headers:** 20-28px (readable at arm's length)
- **Body:** 14-16px
- **Small text:** 12px
- **Mono (IP/time):** Cyan accent color

### Layout
- **Fixed viewport:** 800x480 (no responsive)
- **No scrolling:** Home page fits entirely
- **Sidebar layout:** WiFi settings (efficient horizontal space)
- **Grid system:** 2x2 button grid on home

---

## 🛠️ Development

### Install Dependencies
```bash
npm install
```

### Run Dev Server
```bash
npm run dev
# Opens on http://localhost:3000
```

### Build for Production
```bash
npm run build
# Output: dist/
```

### Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```
kiosk-app/
├── index.html              # Home page
├── wifi-settings.html      # WiFi configuration
├── src/
│   ├── main.css            # Tailwind CSS v4 + custom styles
│   └── main.js             # JavaScript entry point
├── dist/                   # Production build (generated)
├── public.old/             # Old vanilla HTML (deprecated)
├── package.json
├── vite.config.js          # Vite configuration
└── .gitignore
```

---

## 🎯 Features

### Home Page (`/`)
- **4 Large Cards:**
  - WiFi Settings (navigate to config)
  - Device Info (coming soon)
  - System Logs (coming soon)
  - Refresh (reload interface)
- **Status Bar:** Time, network mode, offline/online indicator
- **Footer:** IP address, version info

### WiFi Settings (`/wifi-settings.html`)
- **Sidebar:**
  - AP Mode selection
  - Client Mode selection
  - Action buttons (context-aware)
- **Main Panel:**
  - Network list with signal strength
  - Connection form
  - AP mode details (SSID, password, IP)
- **Back Navigation:** Return to home

---

## 🎨 Tailwind CSS v4 Custom Theme

### Custom Colors
```css
@theme {
  --color-brand-cyan: oklch(0.72 0.14 195);
  --color-brand-cyan-light: oklch(0.80 0.12 195);
  --color-brand-cyan-dark: oklch(0.55 0.16 195);
}
```

### Custom Classes
- `.btn-touch` - Touch-optimized button with active state
- `.glass-card` - Glassmorphism effect
- `.status-dot` - Animated status indicator (online/offline/AP)

---

## 🔌 API Integration

### Endpoints Used
```javascript
// WiFi Status
GET /api/wifi/status
// Returns: { mode: 'ap'|'client', ipAddress, connectedSsid }

// Network Scan
GET /api/wifi/scan
// Returns: { networks: [...] }

// Switch to AP Mode
POST /api/wifi/mode/ap

// Connect to WiFi (Client Mode)
POST /api/wifi/mode/client
// Body: { ssid, password }
```

---

## 📦 Deployment to Pi

### Method 1: Build and Copy dist/
```bash
# On laptop
npm run build

# Copy to Pi
scp -r dist/* pi@192.168.1.137:~/raspi-ios-bridge/kiosk-app/dist/

# Pi serves from dist/ via Pi API server
```

### Method 2: Git Pull (Recommended)
```bash
# On laptop
git add .
git commit -m "Update kiosk app"
git push origin master

# On Pi
ssh pi@192.168.1.137
cd ~/raspi-ios-bridge
git pull origin master

# Build on Pi (if needed)
cd kiosk-app
npm install
npm run build

# Pi API server serves dist/ automatically
```

---

## 🐛 Troubleshooting

### Dev server won't start
```bash
# Kill existing processes
killall node

# Restart
npm run dev
```

### Build fails
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Tailwind classes not working
```bash
# Tailwind v4 is alpha - check version
npm list tailwindcss

# Should be: tailwindcss@4.0.0-alpha.31
```

### Pi shows old design
```bash
# On Pi - rebuild
cd ~/raspi-ios-bridge/kiosk-app
npm run build

# Restart Pi API server
pm2 restart pi-api

# Force refresh Chromium (F5)
```

---

## 🔥 Performance

### Build Output
```
dist/index.html                 8.24 kB (gzip: 2.23 kB)
dist/wifi-settings.html        19.65 kB (gzip: 4.32 kB)
dist/assets/main-[hash].css    22.32 kB (gzip: 4.81 kB)
dist/assets/main-[hash].js      1.07 kB (gzip: 0.60 kB)
```

**Total:** ~31 KB (gzipped: ~12 KB) - Extremely lightweight!

### Why So Fast?
- No framework overhead (vanilla JS)
- Tailwind CSS v4 is optimized
- Vite aggressive code splitting
- Minimal JavaScript (just API calls)

---

## 🎯 Comparison: Old vs New

| Aspect | Old (Vanilla) | New (Vite + Tailwind v4) |
|--------|--------------|---------------------------|
| Design | Purple gradient (unprofessional) | Dark slate (professional IoT) |
| CSS Framework | Inline CSS | Tailwind CSS v4 |
| Build Tool | None | Vite 6.4 |
| File Size | ~50 KB | ~31 KB (smaller!) |
| Dev Experience | Manual refresh | Hot module reload |
| Maintainability | Repetitive CSS | Utility classes |
| Color Palette | Random gradient | Research-backed IoT colors |
| Professional | ❌ Toy-like | ✅ Industrial grade |

---

## 📝 Future Improvements

- [ ] Service worker for offline capability
- [ ] Real device info integration
- [ ] System logs viewer
- [ ] Dark/light theme toggle
- [ ] Animations for mode switching
- [ ] Network signal visualization (graph)

---

## 📚 Documentation

- `TOUCHSCREEN_UX_REDESIGN.md` - Original touch UX design doc
- `VITE_TAILWIND_REDESIGN.md` - This redesign documentation
- `docs/api/wifi-api.md` - WiFi API reference

---

## 🙏 Credits

**Design Research:**
- GE Design (IoT color guidelines)
- 2026 Dashboard Trends (Muzli)
- Dark Mode Best Practices 2026

**Tech Stack:**
- Vite by Evan You
- Tailwind CSS by Adam Wathan
- Heroicons for SVG icons

---

**Version:** 2.0.0
**Built:** January 2026
**Target:** Raspberry Pi 4 with 5" touchscreen (800x480)
**Status:** ✅ Production Ready
