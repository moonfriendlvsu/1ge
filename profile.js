/* ========================================
   1=GE Profile JavaScript
   ======================================== */

// Language System
let currentLang = localStorage.getItem('1ge-lang') || 'kk';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('1ge-lang', lang);

    document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.innerHTML = text;
    });

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
}

// Initialize language
setLanguage(currentLang);

// Language toggle buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
    });
});

// Get User Data
function getUserData() {
    const userData = localStorage.getItem('1ge-user');
    return userData ? JSON.parse(userData) : null;
}

function getTransactions() {
    const transactions = localStorage.getItem('1ge-transactions');
    return transactions ? JSON.parse(transactions) : [];
}

// Check Authentication
const userData = getUserData();

if (!userData) {
    window.location.href = 'login.html';
} else {
    loadProfile(userData);
    loadStats();
}

// Load Profile Data
function loadProfile(userData) {
    // Update avatar
    const avatar = document.getElementById('profile-avatar');
    if (avatar && userData.name) {
        const initials = userData.name.split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
        avatar.textContent = initials;
    }

    // Update name
    const profileName = document.getElementById('profile-name');
    const infoName = document.getElementById('info-name');
    if (profileName && userData.name) profileName.textContent = userData.name;
    if (infoName && userData.name) infoName.textContent = userData.name;

    // Update phone (partially masked)
    const infoPhone = document.getElementById('info-phone');
    if (infoPhone && userData.phone) {
        const phone = userData.phone;
        const masked = phone.slice(0, 4) + ' XXX XX ' + phone.slice(-2);
        infoPhone.textContent = '+7 ' + masked;
    }

    // Update IIN (fully masked for security)
    const infoIin = document.getElementById('info-iin');
    if (infoIin && userData.iin) {
        const iin = userData.iin;
        const masked = iin.slice(0, 4) + ' XXXX ' + iin.slice(-4);
        infoIin.textContent = masked;
    }

    // Registration date
    const infoDate = document.getElementById('info-date');
    if (infoDate) {
        const date = new Date();
        const months = currentLang === 'kk'
            ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
            : ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
        infoDate.textContent = `${months[date.getMonth()]} 2026`;
    }
}

// Load Stats
function loadStats() {
    const transactions = getTransactions();

    // Transaction count
    const statTransactions = document.getElementById('stat-transactions');
    if (statTransactions) {
        statTransactions.textContent = transactions.length;
    }

    // Total spent
    const statSpent = document.getElementById('stat-spent');
    if (statSpent) {
        const totalSpent = transactions
            .filter(tx => tx.type !== 'refill')
            .reduce((sum, tx) => sum + tx.amount, 0);
        statSpent.textContent = totalSpent.toLocaleString() + '₸';
    }
}

// Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('1ge-user');
        localStorage.removeItem('1ge-transactions');
        window.location.href = 'index.html';
    });
}

console.log('1=GE Profile page loaded');
