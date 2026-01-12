/* ========================================
   1=GE Payment JavaScript - Real Balance System
   Fixed: UI sync + persistent storage
   ======================================== */

// ========================================
// Language System
// ========================================
let currentLang = localStorage.getItem('1ge-lang') || 'kk';

function setLanguage(lang) {
    document.querySelectorAll('[data-kk][data-ru]').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.innerHTML = text;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);
    updateBalanceDisplay();
});

// ========================================
// Get User Data
// ========================================
function getUserData() {
    const userData = localStorage.getItem('1ge-user');
    if (userData) {
        return JSON.parse(userData);
    }
    return { balance: 30000, name: 'Пайдаланушы' };
}

function saveUserData(data) {
    // Save to current session
    localStorage.setItem('1ge-user', JSON.stringify(data));

    // Also update in users database for persistence
    const users = JSON.parse(localStorage.getItem('1ge-users') || '{}');
    if (data.phone && users[data.phone]) {
        users[data.phone].balance = data.balance;
        localStorage.setItem('1ge-users', JSON.stringify(users));
    }
}

function getTransactions() {
    const transactions = localStorage.getItem('1ge-transactions');
    return transactions ? JSON.parse(transactions) : [];
}

function saveTransaction(transaction) {
    const transactions = getTransactions();
    transactions.unshift(transaction); // Add to beginning
    localStorage.setItem('1ge-transactions', JSON.stringify(transactions));
}

function updateBalanceDisplay() {
    const userData = getUserData();

    // Update mini balance in header
    const balanceMini = document.querySelector('.balance-mini');
    if (balanceMini) {
        balanceMini.textContent = userData.balance.toLocaleString() + '₸';
    }

    // Update amount hint
    const amountHint = document.querySelector('.amount-hint');
    if (amountHint) {
        amountHint.textContent = `Қолжетімді: ${userData.balance.toLocaleString()}₸`;
    }
}

// ========================================
// Search & Filter
// ========================================
const searchInput = document.getElementById('service-search');
const serviceList = document.getElementById('service-list');
const categoryBtns = document.querySelectorAll('.category-btn');

let currentCategory = 'all';

if (searchInput) {
    searchInput.addEventListener('input', filterServices);
}

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterServices();
    });
});

function filterServices() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const items = serviceList ? serviceList.querySelectorAll('.service-item') : [];

    items.forEach(item => {
        const name = item.querySelector('.service-name').textContent.toLowerCase();
        const category = item.dataset.category;

        const matchesSearch = name.includes(searchTerm);
        const matchesCategory = currentCategory === 'all' || category === currentCategory;

        if (matchesSearch && matchesCategory) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// ========================================
// Payment Modal
// ========================================
const payModal = document.getElementById('pay-modal');
const modalIcon = document.getElementById('modal-icon');
const modalServiceName = document.getElementById('modal-service-name');
const accountInput = document.getElementById('account-number');
const amountInput = document.getElementById('pay-amount');
const summaryService = document.getElementById('summary-service');
const summaryAmount = document.getElementById('summary-amount');
const summaryTotal = document.getElementById('summary-total');

let selectedService = '';
let selectedIcon = '';

function showPaymentForm(event, serviceName, icon) {
    if (event) event.preventDefault();

    selectedService = serviceName;
    selectedIcon = icon;

    if (modalIcon) modalIcon.textContent = icon;
    if (modalServiceName) modalServiceName.textContent = serviceName;
    if (summaryService) summaryService.textContent = serviceName;

    // Update available balance hint
    const userData = getUserData();
    const amountHint = document.querySelector('.amount-hint');
    if (amountHint) {
        amountHint.textContent = `Қолжетімді: ${userData.balance.toLocaleString()}₸`;
    }

    // Update max amount
    if (amountInput) {
        amountInput.max = userData.balance;
    }

    if (payModal) payModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    if (payModal) payModal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form
    if (accountInput) accountInput.value = '';
    if (amountInput) amountInput.value = '';
    updateSummary();
}

// Update summary on amount change
if (amountInput) {
    amountInput.addEventListener('input', updateSummary);
}

function updateSummary() {
    const amount = amountInput ? parseInt(amountInput.value) || 0 : 0;
    if (summaryAmount) summaryAmount.textContent = amount.toLocaleString() + '₸';
    if (summaryTotal) summaryTotal.textContent = amount.toLocaleString() + '₸';
}

// ========================================
// Process Payment - REAL BALANCE UPDATE
// ========================================
const successModal = document.getElementById('success-modal');

function processPayment(event) {
    event.preventDefault();

    const amount = parseInt(amountInput.value);
    const accountNumber = accountInput.value;
    const userData = getUserData();

    // Validation
    if (!amount || amount <= 0) {
        alert(currentLang === 'kk' ? 'Сома енгізіңіз' : 'Введите сумму');
        return;
    }

    if (amount > userData.balance) {
        alert(currentLang === 'kk' ? 'Жеткіліксіз қаражат!' : 'Недостаточно средств!');
        return;
    }

    if (!accountNumber) {
        alert(currentLang === 'kk' ? 'Шот нөмірін енгізіңіз' : 'Введите номер счета');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#pay-form button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    // Simulate payment processing
    setTimeout(() => {
        // Deduct from balance
        userData.balance -= amount;
        saveUserData(userData);

        // Save transaction
        const transaction = {
            id: Date.now(),
            service: selectedService,
            icon: selectedIcon,
            amount: amount,
            accountNumber: accountNumber,
            date: new Date().toISOString(),
            type: 'payment'
        };
        saveTransaction(transaction);

        console.log('Payment processed:', transaction);
        console.log('New balance:', userData.balance);

        // Update UI immediately
        updateBalanceDisplay();

        // Close payment modal
        closePaymentModal();

        // Populate receipt
        populateReceipt(transaction);

        // Show receipt
        if (successModal) {
            successModal.classList.add('active');
        }

        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }, 2000);
}

// Populate receipt with transaction data
function populateReceipt(transaction) {
    const receiptService = document.getElementById('receipt-service');
    const receiptAccount = document.getElementById('receipt-account');
    const receiptDate = document.getElementById('receipt-date');
    const receiptAmount = document.getElementById('receipt-amount');
    const receiptTxId = document.getElementById('receipt-tx-id');

    if (receiptService) receiptService.textContent = transaction.service;
    if (receiptAccount) receiptAccount.textContent = transaction.accountNumber;

    if (receiptDate) {
        const date = new Date(transaction.date);
        const day = date.getDate();
        const months = currentLang === 'kk'
            ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
            : ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        receiptDate.textContent = `${day} ${months[date.getMonth()]}, ${time}`;
    }

    if (receiptAmount) receiptAmount.textContent = transaction.amount.toLocaleString() + '₸';
    if (receiptTxId) receiptTxId.textContent = transaction.id;
}

// Close modal on outside click
if (payModal) {
    payModal.addEventListener('click', (e) => {
        if (e.target === payModal) {
            closePaymentModal();
        }
    });
}

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePaymentModal();
    }
});

// Make functions globally available
window.showPaymentForm = showPaymentForm;
window.closePaymentModal = closePaymentModal;
window.processPayment = processPayment;

console.log('Payment system loaded with real balance tracking');
