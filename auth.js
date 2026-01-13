/* ========================================
   1=GE Authentication with Firebase
   Real backend with Firebase Auth & Firestore
   ======================================== */

// Firebase imports (using ES modules via CDN)
import {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    doc,
    setDoc,
    getDoc
} from './firebase-config.js';

// ========================================
// Language System
// ========================================
let currentLang = localStorage.getItem('1ge-lang') || 'kk';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('1ge-lang', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) {
            el.innerHTML = text;
        }
    });
}

// ========================================
// Error Messages
// ========================================
function getErrorMessage(errorCode) {
    const messages = {
        'auth/email-already-in-use': {
            kk: 'Бұл email тіркелген',
            ru: 'Этот email уже зарегистрирован'
        },
        'auth/invalid-email': {
            kk: 'Email дұрыс емес',
            ru: 'Неверный формат email'
        },
        'auth/weak-password': {
            kk: 'Құпия сөз тым қысқа (мин. 6 таңба)',
            ru: 'Пароль слишком короткий (мин. 6 символов)'
        },
        'auth/user-not-found': {
            kk: 'Пайдаланушы табылмады',
            ru: 'Пользователь не найден'
        },
        'auth/wrong-password': {
            kk: 'Құпия сөз дұрыс емес',
            ru: 'Неверный пароль'
        },
        'auth/invalid-credential': {
            kk: 'Email немесе құпия сөз дұрыс емес',
            ru: 'Неверный email или пароль'
        },
        'auth/too-many-requests': {
            kk: 'Тым көп әрекет. Кейінірек қайталаңыз',
            ru: 'Слишком много попыток. Попробуйте позже'
        }
    };

    const msg = messages[errorCode];
    if (msg) {
        return msg[currentLang] || msg.ru;
    }
    return currentLang === 'kk' ? 'Қате орын алды' : 'Произошла ошибка';
}

// ========================================
// Initialize on DOM Ready
// ========================================
document.addEventListener('DOMContentLoaded', function () {

    // Initialize language
    const langButtons = document.querySelectorAll('.lang-btn');
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

    // IIN validation
    const iinInput = document.getElementById('iin');
    if (iinInput) {
        iinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 12);
        });
    }

    // ========================================
    // Login Form - Firebase Auth
    // ========================================
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button[type="submit"]');

            if (!email || !password) {
                alert(currentLang === 'kk' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля');
                return;
            }

            btn.classList.add('btn-loading');
            btn.disabled = true;

            try {
                // Sign in with Firebase
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.exists() ? userDoc.data() : {};

                // Store user info locally for quick access
                localStorage.setItem('1ge-user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: userData.name || 'Пайдаланушы',
                    balance: userData.balance || 30000
                }));

                console.log('Login successful:', user.email);
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error('Login error:', error);
                alert(getErrorMessage(error.code));
                btn.classList.remove('btn-loading');
                btn.disabled = false;
            }
        });
    }

    // ========================================
    // Registration Form - Firebase Auth
    // ========================================
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const iin = document.getElementById('iin').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('password-confirm').value;
            const btn = registerForm.querySelector('button[type="submit"]');

            // Validation
            if (!name || !email || !iin || !password || !confirmPassword) {
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

            try {
                // Create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save user profile to Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    name: name,
                    email: email,
                    iin: iin,
                    balance: 30000,
                    createdAt: new Date().toISOString()
                });

                // Store user info locally
                localStorage.setItem('1ge-user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: name,
                    balance: 30000
                }));

                console.log('User registered:', user.email);
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error('Registration error:', error);
                alert(getErrorMessage(error.code));
                btn.classList.remove('btn-loading');
                btn.disabled = false;
            }
        });
    }

    // ========================================
    // Forgot Password
    // ========================================
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email')?.value;

            if (!email) {
                alert(currentLang === 'kk' ? 'Email енгізіңіз' : 'Введите email');
                return;
            }

            try {
                await sendPasswordResetEmail(auth, email);
                alert(currentLang === 'kk'
                    ? 'Құпия сөзді қалпына келтіру сілтемесі жіберілді'
                    : 'Ссылка для сброса пароля отправлена на email');
            } catch (error) {
                console.error('Password reset error:', error);
                alert(getErrorMessage(error.code));
            }
        });
    }

    // ========================================
    // Kaspi Login (Demo - not implemented)
    // ========================================
    const kaspiBtn = document.querySelector('.kaspi-btn');
    if (kaspiBtn) {
        kaspiBtn.addEventListener('click', () => {
            alert(currentLang === 'kk' ? 'Kaspi қосылым әлі дайын емес' : 'Интеграция с Kaspi в разработке');
        });
    }

    console.log('1=GE Auth loaded (Firebase mode)');
});

// ========================================
// Export for use in other pages
// ========================================
export { auth, db, signOut, currentLang };
