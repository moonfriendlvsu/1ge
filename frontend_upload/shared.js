/* ========================================
   1=GE Shared Logic for Dashboard Pages
   Handles: Disclaimer Banner & Header Positioning
   ======================================== */

function updateAppLayout() {
    const banner = document.querySelector('.disclaimer-banner');
    const header = document.querySelector('.dash-header') ||
        document.querySelector('.tx-header') ||
        document.querySelector('.profile-header') ||
        document.querySelector('.pay-header') ||
        document.querySelector('.faq-header') ||
        document.querySelector('.admin-header');

    // Only proceed if elements exist
    if (!banner || !header) return;

    // Get current height of banner (it changes based on language/screen width)
    const bannerHeight = banner.offsetHeight;

    // 1. Move Header Down
    // The header is fixed to top: 0 by default. Push it down by banner height.
    header.style.top = bannerHeight + 'px';

    // 2. Push Page Content Down
    // The main content is obscured by the fixed header.
    // We need to add padding-top to body or main container equal to:
    // Banner Height + Header Height + some spacing
    const headerHeight = header.offsetHeight;
    const totalTopOffset = bannerHeight + headerHeight;

    // Target the main scrollable area or body padding
    const main = document.querySelector('main') ||
        document.querySelector('.dash-main') ||
        document.querySelector('.tx-main') ||
        document.querySelector('.profile-main') ||
        document.querySelector('.pay-main') ||
        document.querySelector('.faq-main') ||
        document.querySelector('.admin-container');

    if (main) {
        // Add 20px extra spacing for breathing room
        main.style.paddingTop = (totalTopOffset + 20) + 'px';
    }
}

// Run on events that might change layout
window.addEventListener('resize', updateAppLayout);
window.addEventListener('load', updateAppLayout);
document.addEventListener('DOMContentLoaded', updateAppLayout);

// Run after a short delay to account for font loading/rendering
setTimeout(updateAppLayout, 100);
setTimeout(updateAppLayout, 500);

// Export to global scope so other scripts can call it after language change
window.updateAppLayout = updateAppLayout;
