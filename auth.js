/* ========================================
   1=GE Authentication - Simplified (No Firebase)
   Demo version using localStorage
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {

    // ========================================
    // Language System
    // ========================================
    const langButtons = document.querySelectorAll('.lang-btn');
    let currentLang = localStorage.getItem('1ge-lang') || 'kk';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('1ge-lang', lang);

        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
            const text = el.getAttribute(`data-${lang}`);
            if (text) {
                el.innerHTML = text;
            }
        });
    }

    setLanguage(currentLang);

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
    // Phone Number Formatting
    // ========================================
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
            if (value.length > 0) {
                let formatted = '+' + value.slice(0, 1);
                if (value.length > 1) formatted += ' ' + value.slice(1, 4);
                if (value.length > 4) formatted += ' ' + value.slice(4, 7);
                if (value.length > 7) formatted += ' ' + value.slice(7, 11);
                e.target.value = formatted;
            }
        });
    }

    // IIN validation
    const iinInput = document.getElementById('iin');
    if (iinInput) {
        iinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
        });
    }

    // ========================================
    // Login Form (Demo - localStorage only)
    // ========================================
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button[type="submit"]');

            if (!phone || !password) {
                alert(currentLang === 'kk' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля');
                return;
            }

            btn.classList.add('btn-loading');
            btn.disabled = true;

            // Demo: Get user from localStorage or create session
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('1ge-users') || '{}');
                const cleanPhone = phone.replace(/\D/g, '');

                if (users[cleanPhone]) {
                    if (users[cleanPhone].password === password) {
                        // Login successful
                        localStorage.setItem('1ge-user', JSON.stringify({
                            phone: cleanPhone,
                            name: users[cleanPhone].name,
                            balance: users[cleanPhone].balance || 30000
                        }));
                        window.location.href = 'dashboard.html';
                    } else {
                        alert(currentLang === 'kk' ? 'Құпия сөз дұрыс емес' : 'Неверный пароль');
                        btn.classList.remove('btn-loading');
                        btn.disabled = false;
                    }
                } else {
                    alert(currentLang === 'kk' ? 'Пайдаланушы табылмады. Тіркеліңіз.' : 'Пользователь не найден. Зарегистрируйтесь.');
                    btn.classList.remove('btn-loading');
                    btn.disabled = false;
                }
            }, 1000);
        });
    }

    // ========================================
    // Registration Form (Demo - localStorage only)
    // ========================================
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const iin = document.getElementById('iin').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('password-confirm').value;
            const btn = registerForm.querySelector('button[type="submit"]');

            // Validation
            if (!name || !phone || !iin || !password || !confirmPassword) {
                alert(currentLang === 'kk' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля');
                return;
            }

            if (password !== confirmPassword) {
                alert(currentLang === 'kk' ? 'Құпия сөздер сәйкес емес!' : 'Пароли не совпадают!');
                return;
            }

            if (password.length < 6) {
                alert(currentLang === 'kk' ? 'Құпия сөз кемінде 6 таңба болуы керек' : 'Пароль должен быть минимум 6 символов');
                return;
            }

            if (iin.length !== 12) {
                alert(currentLang === 'kk' ? 'ИИН 12 сан болуы керек' : 'ИИН должен содержать 12 цифр');
                return;
            }

            btn.classList.add('btn-loading');
            btn.disabled = true;

            setTimeout(() => {
                const cleanPhone = phone.replace(/\D/g, '');

                // Save user to localStorage
                const users = JSON.parse(localStorage.getItem('1ge-users') || '{}');

                if (users[cleanPhone]) {
                    alert(currentLang === 'kk' ? 'Бұл телефон нөмірі тіркелген' : 'Этот номер уже зарегистрирован');
                    btn.classList.remove('btn-loading');
                    btn.disabled = false;
                    return;
                }

                users[cleanPhone] = {
                    name: name,
                    phone: cleanPhone,
                    iin: iin,
                    password: password,
                    balance: 30000,
                    createdAt: new Date().toISOString()
                };

                localStorage.setItem('1ge-users', JSON.stringify(users));

                // Auto-login after registration
                localStorage.setItem('1ge-user', JSON.stringify({
                    phone: cleanPhone,
                    name: name,
                    balance: 30000
                }));

                console.log('User registered and logged in:', name);
                window.location.href = 'dashboard.html';
            }, 1000);
        });
    }

    // ========================================
    // Kaspi Login (Demo)
    // ========================================
    const kaspiBtn = document.querySelector('.kaspi-btn');
    if (kaspiBtn) {
        kaspiBtn.addEventListener('click', () => {
            alert(currentLang === 'kk' ? 'Kaspi қосылым әлі дайын емес' : 'Интеграция с Kaspi в разработке');
        });
    }

    console.log('1=GE Auth loaded (demo mode)');
});
