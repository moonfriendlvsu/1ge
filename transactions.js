/* ========================================
   1=GE Transactions JavaScript
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

    // Update search placeholder
    const searchInput = document.getElementById('tx-search');
    if (searchInput) {
        const placeholder = searchInput.getAttribute(`data-${lang}-placeholder`);
        if (placeholder) searchInput.placeholder = placeholder;
    }
}

// Initialize language
setLanguage(currentLang);

// Get Transactions
function getTransactions() {
    const transactions = localStorage.getItem('1ge-transactions');
    return transactions ? JSON.parse(transactions) : [];
}

// Category mapping
const categoryMapping = {
    // Utilities
    'Алматы Электр Желісі': 'utilities',
    'AlmatyEnergoSbyt': 'utilities',
    'ҚазТрансГаз': 'utilities',
    'Алматығаз': 'utilities',
    'Алматы Су': 'utilities',
    'Алматы Жылу': 'utilities',
    // Groceries
    'Magnum Cash&Carry': 'groceries',
    'Small': 'groceries',
    'Anvar': 'groceries',
    'Ramstore': 'groceries',
    'Алтын Орда базары': 'groceries',
    'Зеленый базар': 'groceries',
    // Pharmacy
    'Europharma': 'pharmacy',
    'Биосфера': 'pharmacy',
    'Саулык': 'pharmacy',
    'Дарус Фарма': 'pharmacy',
    'Гиппократ': 'pharmacy',
    'Фармация': 'pharmacy'
};

// Current filter
let currentFilter = 'all';
let searchQuery = '';

// Load and render transactions
function loadTransactions() {
    const transactions = getTransactions();
    const txList = document.getElementById('tx-list');
    const totalCount = document.getElementById('total-count');
    const totalAmount = document.getElementById('total-amount');

    if (!txList) return;

    // Filter transactions
    let filtered = transactions.filter(tx => {
        // Category filter
        if (currentFilter !== 'all') {
            const category = categoryMapping[tx.service] || 'other';
            if (category !== currentFilter) return false;
        }

        // Search filter
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const serviceLower = tx.service.toLowerCase();
            if (!serviceLower.includes(searchLower)) return false;
        }

        return true;
    });

    // Update summary
    if (totalCount) totalCount.textContent = filtered.length;
    if (totalAmount) {
        const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);
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
                        ${isRefill ? '+' : '-'}${tx.amount.toLocaleString()}₸
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
        loadTransactions();
    });
});

// Search
const searchInput = document.getElementById('tx-search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        loadTransactions();
    });
}

// Initial load
loadTransactions();

console.log('1=GE Transactions page loaded');
