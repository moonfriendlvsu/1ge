/* ========================================
   1=GE Authentication with Firebase
   ======================================== */

// Firebase imports (using CDN modules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDKmaJATjfIDfV7VJiISLb6qHp0y3Km4iw",
    authDomain: "ge-company.firebaseapp.com",
    projectId: "ge-company",
    storageBucket: "ge-company.firebasestorage.app",
    messagingSenderId: "845786400154",
    appId: "1:845786400154:web:c170eda08b86a9876e2623",
    measurementId: "G-XFP26ZDCJH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ========================================
// Language System
// ========================================
let currentLang = localStorage.getItem('1ge-lang') || 'kk';

const langButtons = document.querySelectorAll('.lang-btn');

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

// Initialize language
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
// Helper Functions
// ========================================
function showError(message) {
    alert(message);
}

function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Create email from phone number (Firebase requires email)
function phoneToEmail(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@1ge.kz`;
}

// ========================================
// Login Form
// ========================================
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button[type="submit"]');

        if (!phone || !password) {
            showError(currentLang === 'kk' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля');
            return;
        }

        setLoading(btn, true);

        try {
            const email = phoneToEmail(phone);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Save user info to localStorage
            localStorage.setItem('1ge-user', JSON.stringify({
                uid: userCredential.user.uid,
                phone: phone,
                name: userCredential.user.displayName || 'Пайдаланушы'
            }));

            // Redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Login error:', error);

            let errorMessage = currentLang === 'kk'
                ? 'Кіру қатесі. Телефон немесе құпия сөз дұрыс емес.'
                : 'Ошибка входа. Неверный телефон или пароль.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = currentLang === 'kk'
                    ? 'Пайдаланушы табылмады. Тіркеліңіз.'
                    : 'Пользователь не найден. Зарегистрируйтесь.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = currentLang === 'kk'
                    ? 'Құпия сөз дұрыс емес'
                    : 'Неверный пароль';
            }

            showError(errorMessage);
            setLoading(btn, false);
        }
    });
}

// ========================================
// Registration Form
// ========================================
const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const iin = document.getElementById('iin').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('password-confirm').value;
        const btn = registerForm.querySelector('button[type="submit"]');

        // Validation
        if (!name || !phone || !iin || !password || !confirmPassword) {
            showError(currentLang === 'kk' ? 'Барлық өрістерді толтырыңыз' : 'Заполните все поля');
            return;
        }

        if (password !== confirmPassword) {
            showError(currentLang === 'kk' ? 'Құпия сөздер сәйкес емес!' : 'Пароли не совпадают!');
            return;
        }

        if (password.length < 6) {
            showError(currentLang === 'kk' ? 'Құпия сөз кемінде 6 таңба болуы керек' : 'Пароль должен быть минимум 6 символов');
            return;
        }

        if (iin.length !== 12) {
            showError(currentLang === 'kk' ? 'ИИН 12 сан болуы керек' : 'ИИН должен содержать 12 цифр');
            return;
        }

        setLoading(btn, true);

        try {
            const email = phoneToEmail(phone);

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with name
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Save additional data to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: name,
                phone: phone,
                iin: iin,
                balance: 30000, // Starting balance
                verified: false,
                createdAt: new Date().toISOString()
            });

            // Save to localStorage
            localStorage.setItem('1ge-user', JSON.stringify({
                uid: userCredential.user.uid,
                phone: phone,
                name: name
            }));

            // Redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            console.error('Registration error:', error);

            let errorMessage = currentLang === 'kk'
                ? 'Тіркелу қатесі. Қайталап көріңіз.'
                : 'Ошибка регистрации. Попробуйте ещё раз.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = currentLang === 'kk'
                    ? 'Бұл телефон нөмірі тіркелген'
                    : 'Этот номер телефона уже зарегистрирован';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = currentLang === 'kk'
                    ? 'Құпия сөз тым қарапайым'
                    : 'Пароль слишком простой';
            }

            showError(errorMessage);
            setLoading(btn, false);
        }
    });
}

// ========================================
// Kaspi Login (Demo - Not implemented)
// ========================================
const kaspiBtn = document.querySelector('.kaspi-btn');
if (kaspiBtn) {
    kaspiBtn.addEventListener('click', () => {
        alert(currentLang === 'kk' ? 'Kaspi қосылым әлі дайын емес' : 'Интеграция с Kaspi в разработке');
    });
}

// ========================================
// Check Auth State
// ========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User logged in:', user.email);
    } else {
        console.log('User not logged in');
    }
});

// Export for use in other files
window.firebaseAuth = {
    auth,
    db,
    signOut: () => signOut(auth)
};
