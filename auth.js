/* ========================================
   1=GE Authentication JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {

    // ========================================
    // Language Toggle
    // ========================================
    const langButtons = document.querySelectorAll('.lang-btn');
    let currentLang = localStorage.getItem('1ge-lang') || 'kk';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('1ge-lang', lang);

        // Update button states
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // Translate all elements
        document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                el.innerHTML = text;
            }
        });
    }

    // Initialize language
    setLanguage(currentLang);

    // Add click handlers
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    // ========================================
    // Password Toggle
    // ========================================
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }

    // ========================================
    // Form Validation
    // ========================================
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0 && !value.startsWith('7')) {
                value = '7' + value;
            }
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            // Format as +7 XXX XXX XXXX
            if (value.length > 0) {
                let formatted = '+' + value.slice(0, 1);
                if (value.length > 1) formatted += ' ' + value.slice(1, 4);
                if (value.length > 4) formatted += ' ' + value.slice(4, 7);
                if (value.length > 7) formatted += ' ' + value.slice(7, 11);
                e.target.value = formatted;
            }
        });
    }

    // IIN validation (12 digits)
    const iinInput = document.getElementById('iin');
    if (iinInput) {
        iinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = loginForm.querySelector('button[type="submit"]');
            btn.classList.add('btn-loading');

            // Simulate login (replace with real API call)
            setTimeout(() => {
                btn.classList.remove('btn-loading');
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            }, 1500);
        });
    }

    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('password-confirm').value;

            if (password !== confirmPassword) {
                alert(currentLang === 'kk' ? 'Құпия сөздер сәйкес емес!' : 'Пароли не совпадают!');
                return;
            }

            const btn = registerForm.querySelector('button[type="submit"]');
            btn.classList.add('btn-loading');

            // Simulate registration (replace with real API call)
            setTimeout(() => {
                btn.classList.remove('btn-loading');
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            }, 1500);
        });
    }

    // ========================================
    // Kaspi Login (Demo)
    // ========================================
    const kaspiBtn = document.querySelector('.kaspi-btn');
    if (kaspiBtn) {
        kaspiBtn.addEventListener('click', () => {
            kaspiBtn.classList.add('btn-loading');

            setTimeout(() => {
                kaspiBtn.classList.remove('btn-loading');
                // In real app, this would open Kaspi OAuth
                alert(currentLang === 'kk' ? 'Kaspi қосылым әлі дайын емес' : 'Интеграция с Kaspi в разработке');
            }, 1000);
        });
    }
});
