/* ========================================
   1=GE Dashboard JavaScript with Firebase
   ======================================== */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
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

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('1ge-lang', lang);

    document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.innerHTML = text;
    });
}

setLanguage(currentLang);

// ========================================
// Check Authentication
// ========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('User logged in:', user.email);

        // Get user data from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                updateDashboard(userData);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } else {
        // Not logged in - redirect to login
        console.log('User not logged in, redirecting...');
        window.location.href = 'login.html';
    }
});

// ========================================
// Update Dashboard with User Data
// ========================================
function updateDashboard(userData) {
    // Update user name
    const userName = document.querySelector('.user-name');
    if (userName && userData.name) {
        userName.textContent = userData.name;
    }

    // Update avatar initials
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && userData.name) {
        const initials = userData.name.split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        userAvatar.textContent = initials;
    }

    // Update balance
    const balanceValue = document.querySelector('.balance-value');
    if (balanceValue && userData.balance !== undefined) {
        animateBalance(balanceValue, userData.balance);
    }

    // Update verification status
    const userStatus = document.querySelector('.user-status');
    if (userStatus) {
        if (userData.verified) {
            userStatus.textContent = currentLang === 'kk' ? '✓ Верификацияланған' : '✓ Верифицирован';
        } else {
            userStatus.textContent = currentLang === 'kk' ? '⏳ Тексеруде' : '⏳ На проверке';
            userStatus.style.color = '#F59E0B';
        }
    }
}

// ========================================
// Balance Animation
// ========================================
function animateBalance(element, targetValue) {
    let currentValue = 0;
    const duration = 1000;
    const steps = 60;
    const increment = targetValue / steps;
    const stepDuration = duration / steps;

    function animate() {
        if (currentValue < targetValue) {
            currentValue = Math.min(currentValue + increment, targetValue);
            element.textContent = Math.floor(currentValue).toLocaleString('ru-RU').replace(/,/g, ' ');
            setTimeout(animate, stepDuration);
        }
    }

    setTimeout(animate, 300);
}

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

    document.addEventListener('click', () => {
        userMenu.classList.remove('active');
    });

    userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// ========================================
// Logout
// ========================================
const logoutBtn = document.querySelector('.logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            await signOut(auth);
            localStorage.removeItem('1ge-user');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// ========================================
// Service Worker Update
// ========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        registration.update();
    });
}

console.log('1=GE Dashboard loaded with Firebase');
