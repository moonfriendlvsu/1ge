/* ========================================
   1=GE Payment - Firebase Firestore Backend
   ======================================== */

// Firebase imports
import {
    auth,
    db,
    onAuthStateChanged,
    doc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp
} from './firebase-config.js';

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

// ========================================
// Global State
// ========================================
let currentUser = null;
let userProfile = null;
let selectedService = '';
let selectedIcon = '';

// ========================================
// Initialize on Auth State Change
// ========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('Payment page - User authenticated:', user.email);

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                userProfile = userDoc.data();
                userProfile.uid = user.uid;

                // Update local cache
                localStorage.setItem('1ge-user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: userProfile.name,
                    balance: userProfile.balance
                }));

                updateBalanceDisplay();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fall back to cache
            const cached = localStorage.getItem('1ge-user');
            if (cached) {
                userProfile = JSON.parse(cached);
                updateBalanceDisplay();
            }
        }
    } else {
        console.log('No user, redirecting to login...');
        window.location.href = 'login.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setLanguage(currentLang);

    // Try to show cached balance immediately
    const cached = localStorage.getItem('1ge-user');
    if (cached) {
        userProfile = JSON.parse(cached);
        updateBalanceDisplay();
    }
});

// ========================================
// Balance Display
// ========================================
function updateBalanceDisplay() {
    if (!userProfile) return;

    const balance = userProfile.balance || 0;

    // Update mini balance in header
    const balanceMini = document.querySelector('.balance-mini');
    if (balanceMini) {
        balanceMini.textContent = balance.toLocaleString() + '₸';
    }

    // Update amount hint
    const amountHint = document.querySelector('.amount-hint');
    if (amountHint) {
        const label = currentLang === 'kk' ? 'Қолжетімді' : 'Доступно';
        amountHint.textContent = `${label}: ${balance.toLocaleString()}₸`;
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

function showPaymentForm(event, serviceName, icon) {
    if (event) event.preventDefault();

    selectedService = serviceName;
    selectedIcon = icon;

    if (modalIcon) modalIcon.textContent = icon;
    if (modalServiceName) modalServiceName.textContent = serviceName;
    if (summaryService) summaryService.textContent = serviceName;

    // Update available balance hint
    if (userProfile) {
        const balance = userProfile.balance || 0;
        const amountHint = document.querySelector('.amount-hint');
        if (amountHint) {
            const label = currentLang === 'kk' ? 'Қолжетімді' : 'Доступно';
            amountHint.textContent = `${label}: ${balance.toLocaleString()}₸`;
        }
        if (amountInput) {
            amountInput.max = balance;
        }
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
// Process Payment - FIREBASE BACKEND
// ========================================
const successModal = document.getElementById('success-modal');

async function processPayment(event) {
    event.preventDefault();

    const amount = parseInt(amountInput.value);
    const accountNumber = accountInput.value;

    // Validation
    if (!amount || amount <= 0) {
        alert(currentLang === 'kk' ? 'Сома енгізіңіз' : 'Введите сумму');
        return;
    }

    if (!userProfile || amount > userProfile.balance) {
        alert(currentLang === 'kk' ? 'Жеткіліксіз қаражат!' : 'Недостаточно средств!');
        return;
    }

    if (!accountNumber) {
        alert(currentLang === 'kk' ? 'Шот нөмірін енгізіңіз' : 'Введите номер счета');
        return;
    }

    if (!currentUser) {
        alert(currentLang === 'kk' ? 'Қате! Авторизация қажет' : 'Ошибка! Требуется авторизация');
        window.location.href = 'login.html';
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#pay-form button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    try {
        const newBalance = userProfile.balance - amount;
        const txDate = new Date().toISOString();

        // 1. Update balance in Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
            balance: newBalance
        });

        // 2. Add transaction to Firestore
        const txRef = await addDoc(collection(db, 'transactions'), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            service: selectedService,
            icon: selectedIcon,
            amount: amount,
            accountNumber: accountNumber,
            date: txDate,
            type: 'payment',
            createdAt: serverTimestamp()
        });

        const transaction = {
            id: txRef.id,
            service: selectedService,
            icon: selectedIcon,
            amount: amount,
            accountNumber: accountNumber,
            date: txDate,
            type: 'payment'
        };

        console.log('Payment saved to Firestore:', transaction);
        console.log('New balance:', newBalance);

        // 3. Update local state
        userProfile.balance = newBalance;
        localStorage.setItem('1ge-user', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            name: userProfile.name,
            balance: newBalance
        }));

        // Update cached transactions
        const cachedTx = JSON.parse(localStorage.getItem('1ge-transactions') || '[]');
        cachedTx.unshift(transaction);
        localStorage.setItem('1ge-transactions', JSON.stringify(cachedTx));

        // 4. Update UI
        updateBalanceDisplay();
        closePaymentModal();
        populateReceipt(transaction);

        if (successModal) {
            successModal.classList.add('active');
        }

    } catch (error) {
        console.error('Payment error:', error);
        alert(currentLang === 'kk'
            ? 'Төлем қатесі. Қайта көріңіз.'
            : 'Ошибка оплаты. Попробуйте снова.');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
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

// Make functions globally available for onclick handlers
window.showPaymentForm = showPaymentForm;
window.closePaymentModal = closePaymentModal;
window.processPayment = processPayment;

console.log('1=GE Payment loaded (Firebase mode)');
