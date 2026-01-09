/* ========================================
   1=GE Dashboard JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {

    // ========================================
    // Language System
    // ========================================
    let currentLang = localStorage.getItem('1ge-lang') || 'kk';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('1ge-lang', lang);

        document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                el.innerHTML = text;
            }
        });
    }

    // Initialize language
    setLanguage(currentLang);

    // ========================================
    // User Menu Toggle
    // ========================================
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenu = document.getElementById('user-menu');

    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            userMenu.classList.remove('active');
        });

        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // ========================================
    // Balance Animation
    // ========================================
    const balanceValue = document.querySelector('.balance-value');

    if (balanceValue) {
        const targetValue = 30000;
        let currentValue = 0;
        const duration = 1000;
        const steps = 60;
        const increment = targetValue / steps;
        const stepDuration = duration / steps;

        function animateBalance() {
            if (currentValue < targetValue) {
                currentValue = Math.min(currentValue + increment, targetValue);
                balanceValue.textContent = Math.floor(currentValue).toLocaleString('ru-RU').replace(/,/g, ' ');
                setTimeout(animateBalance, stepDuration);
            }
        }

        // Start animation after a short delay
        setTimeout(animateBalance, 300);
    }

    // ========================================
    // Action Cards Interaction
    // ========================================
    const actionCards = document.querySelectorAll('.action-card:not(.action-disabled)');

    actionCards.forEach(card => {
        card.addEventListener('click', function (e) {
            // Add ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ========================================
    // Pull to Refresh (Mobile)
    // ========================================
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY;

        if (diff > 100) {
            // Could show refresh indicator here
        }
    });

    document.addEventListener('touchend', () => {
        isPulling = false;
    });

    // ========================================
    // Service Worker Update Check
    // ========================================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }

    // ========================================
    // Check Auth (Demo)
    // ========================================
    // In real app, check if user is logged in
    // For demo, we just log to console
    console.log('1=GE Dashboard loaded');
    console.log('User: Асан Қасым (demo)');
    console.log('Balance: 30,000₸');
});
