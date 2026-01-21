// Main JavaScript entry point for Raspberry Pi iOS Bridge Kiosk
// Vite + Tailwind CSS v4

console.log('🍓 Raspberry Pi iOS Bridge Kiosk v2.0.0');
console.log('Built with Vite + Tailwind CSS v4');

// Service worker registration for offline capability (future)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Service worker support detected');
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Prevent context menu on long press (better touch experience)
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Export for potential future modules
export default {
  version: '2.0.0',
  buildTool: 'vite',
  cssFramework: 'tailwind-v4'
};
