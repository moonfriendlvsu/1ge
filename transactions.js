/* ========================================
   1=GE Transactions - Firebase Backend
   ======================================== */

// Firebase imports
import {
    auth,
    db,
    onAuthStateChanged,
    collection,
    query,
    where,
    orderBy,
    getDocs
} from './firebase-config.js';

// Language System
let currentLang = localStorage.getItem('1ge-lang') || 'kk';

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('1ge-lang', lang);

    document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.innerHTML = text;
    });

    // Update search placeholder
    const searchInput = document.getElementById('tx-search');
    if (searchInput) {
        const placeholder = searchInput.getAttribute(`data-${lang}-placeholder`);
        if (placeholder) searchInput.placeholder = placeholder;
    }
}

// Initialize language
setLanguage(currentLang);

// Apply saved theme
const savedTheme = localStorage.getItem('1ge-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Category mapping
const categoryMapping = {
    // Utilities
    'Алматы Энерго Сбыт': 'utilities',
    'Алматы Электр Желісі': 'utilities',
    'AlmatyEnergoSbyt': 'utilities',
    'ҚазТрансГаз': 'utilities',
    'Алматығаз': 'utilities',
    'Алматы Су': 'utilities',
    'Алматы Жылу': 'utilities',
    'Алатау Жылу': 'utilities',
    'Орал Энерго': 'utilities',
    'Шымкент Энерго': 'utilities',
    'КарагандыЖылуСбыт': 'utilities',
    'Астана Энерго': 'utilities',
    // Groceries
    'Magnum': 'groceries',
    'Magnum Cash&Carry': 'groceries',
    'Small': 'groceries',
    'Small Market': 'groceries',
    'Anvar': 'groceries',
    'Арзан': 'groceries',
    'Анвар': 'groceries',
    'Ramstore': 'groceries',
    'Алтын Орда базары': 'groceries',
    'Зеленый базар': 'groceries',
    // Pharmacy
    'Europharma': 'pharmacy',
    'Sadykhan': 'pharmacy',
    'Pharma Plus': 'pharmacy',
    'Биосфера': 'pharmacy',
    'Саулык': 'pharmacy',
    'Дарус Фарма': 'pharmacy',
    'Гиппократ': 'pharmacy',
    'Фармация': 'pharmacy'
};

// Global state
let currentUser = null;
let allTransactions = [];
let currentFilter = 'all';
let searchQuery = '';

// Check Authentication with Firebase
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('Transactions page - User authenticated:', user.email);
        await loadTransactionsFromFirestore();
    } else {
        console.log('No user, redirecting to login...');
        window.location.href = 'login.html';
    }
});

// Load Transactions from Firestore
async function loadTransactionsFromFirestore() {
    const txList = document.getElementById('tx-list');

    if (txList) {
        // Loading state handled by skeletons in HTML
    }

    try {
        // Query transactions from Firestore
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        allTransactions = [];

        snapshot.forEach(doc => {
            allTransactions.push({ id: doc.id, ...doc.data() });
        });

        console.log('Loaded transactions from Firestore:', allTransactions.length);

        // Cache locally
        localStorage.setItem('1ge-transactions', JSON.stringify(allTransactions));

        renderTransactions();

    } catch (error) {
        console.error('Error loading transactions:', error);

        // Fall back to cache
        const cached = localStorage.getItem('1ge-transactions');
        allTransactions = cached ? JSON.parse(cached) : [];
        renderTransactions();
    }
}

// Render Transactions
function renderTransactions() {
    const txList = document.getElementById('tx-list');
    const totalCount = document.getElementById('total-count');
    const totalAmount = document.getElementById('total-amount');

    if (!txList) return;

    // Filter transactions
    let filtered = allTransactions.filter(tx => {
        // Category filter
        if (currentFilter !== 'all') {
            const category = categoryMapping[tx.service] || 'other';
            if (category !== currentFilter) return false;
        }

        // Search filter
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const serviceLower = (tx.service || '').toLowerCase();
            if (!serviceLower.includes(searchLower)) return false;
        }

        return true;
    });

    // Update summary
    if (totalCount) totalCount.textContent = filtered.length;
    if (totalAmount) {
        const total = filtered.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        totalAmount.textContent = total.toLocaleString() + '₸';
    }

    // Clear list
    txList.innerHTML = '';

    if (filtered.length === 0) {
        txList.innerHTML = `
            <div class="tx-empty">
                <span>📭</span>
                <p data-kk="Транзакциялар табылмады" data-ru="Транзакции не найдены">Транзакциялар табылмады</p>
            </div>
        `;
        return;
    }

    // Group by date
    const grouped = {};
    filtered.forEach(tx => {
        const date = new Date(tx.date);
        const dateKey = date.toDateString();
        if (!grouped[dateKey]) {
            grouped[dateKey] = {
                date: date,
                transactions: []
            };
        }
        grouped[dateKey].transactions.push(tx);
    });

    // Render grouped transactions
    Object.values(grouped).forEach(group => {
        const date = group.date;
        const day = date.getDate();
        const months = currentLang === 'kk'
            ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
            : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

        // Date header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'tx-date-group';
        dateHeader.textContent = `${day} ${months[date.getMonth()]}`;
        txList.appendChild(dateHeader);

        // Transactions for this date
        group.transactions.forEach(tx => {
            const time = new Date(tx.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const isRefill = tx.type === 'refill';

            const txHtml = `
                <div class="tx-item">
                    <div class="tx-icon">${tx.icon || '💳'}</div>
                    <div class="tx-info">
                        <span class="tx-service">${tx.service}</span>
                        <span class="tx-date">${time}</span>
                        <span class="tx-account">${tx.accountNumber || ''}</span>
                    </div>
                    <span class="tx-amount ${isRefill ? 'positive' : 'negative'}">
                        ${isRefill ? '+' : '-'}${(tx.amount || 0).toLocaleString()}₸
                    </span>
                </div>
            `;
            txList.insertAdjacentHTML('beforeend', txHtml);
        });
    });
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTransactions();
    });
});

// Search
const searchInput = document.getElementById('tx-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTransactions();
    });
}

// ========================================
// Export to CSV
// ========================================
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (allTransactions.length === 0) {
            alert(currentLang === 'kk' ? 'Экспорттау үшін транзакциялар жоқ' : 'Нет транзакций для экспорта');
            return;
        }

        // Create CSV content
        const headers = ['Күні', 'Сервис', 'Сома', 'Түрі'];
        const rows = allTransactions.map(tx => {
            const date = new Date(tx.date).toLocaleDateString('ru-RU');
            const service = tx.service || '';
            const amount = tx.amount || 0;
            const type = tx.type === 'refill' ? 'Пополнение' : 'Оплата';
            return [date, service, amount, type].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `1GE_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Show success
        alert(currentLang === 'kk' ? '✅ CSV файл жүктелді!' : '✅ CSV файл скачан!');
    });
}

console.log('1=GE Transactions loaded (Firebase mode)');
