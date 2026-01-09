/* ========================================
   1=GE Dashboard - Real Balance & Transactions
   ======================================== */

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
// Get User & Transaction Data
// ========================================
function getUserData() {
    const userData = localStorage.getItem('1ge-user');
    if (userData) {
        return JSON.parse(userData);
    }
    return null;
}

function getTransactions() {
    const transactions = localStorage.getItem('1ge-transactions');
    return transactions ? JSON.parse(transactions) : [];
}

// ========================================
// Check Authentication
// ========================================
const userData = getUserData();

if (!userData) {
    console.log('No user in localStorage, redirecting to login...');
    window.location.href = 'login.html';
} else {
    console.log('User found:', userData);
    updateDashboard(userData);
    loadTransactions();
}

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
    const balance = userData.balance !== undefined ? userData.balance : 30000;
    const balanceValue = document.querySelector('.balance-value');
    if (balanceValue) {
        animateBalance(balanceValue, balance);
    }

    // Update limit bar
    const limitFill = document.querySelector('.limit-fill');
    const limitText = document.querySelector('.limit-text span:last-child');
    if (limitFill) {
        const percentage = (balance / 30000) * 100;
        limitFill.style.width = percentage + '%';
    }
    if (limitText) {
        limitText.textContent = `${balance.toLocaleString()}₸ / 30 000₸`;
    }

    console.log('Dashboard updated. Balance:', balance);
}

// ========================================
// Load Real Transactions
// ========================================
function loadTransactions() {
    const transactions = getTransactions();
    const transactionsList = document.querySelector('.transactions-list');

    if (!transactionsList) return;

    // Clear existing transactions
    transactionsList.innerHTML = '';

    if (transactions.length === 0) {
        // Show empty state
        transactionsList.innerHTML = `
            <div class="transaction-empty">
                <span>📭</span>
                <p data-kk="Транзакциялар жоқ" data-ru="Нет транзакций">Транзакциялар жоқ</p>
            </div>
        `;
        return;
    }

    // Show last 10 transactions
    transactions.slice(0, 10).forEach(tx => {
        const date = new Date(tx.date);
        const day = date.getDate();
        const month = currentLang === 'kk'
            ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'][date.getMonth()]
            : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][date.getMonth()];
        const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        const isRefill = tx.type === 'refill';

        const txHtml = `
            <div class="transaction-item ${isRefill ? 'refill' : ''}">
                <div class="transaction-icon">${tx.icon || '💳'}</div>
                <div class="transaction-info">
                    <span class="transaction-title">${tx.service}</span>
                    <span class="transaction-date">${day} ${month}, ${time}</span>
                </div>
                <span class="transaction-amount ${isRefill ? 'positive' : 'negative'}">
                    ${isRefill ? '+' : '-'}${tx.amount.toLocaleString()}₸
                </span>
            </div>
        `;

        transactionsList.insertAdjacentHTML('beforeend', txHtml);
    });
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
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('1ge-user');
        localStorage.removeItem('1ge-transactions');
        window.location.href = 'index.html';
    });
}

console.log('1=GE Dashboard loaded with real balance system');
