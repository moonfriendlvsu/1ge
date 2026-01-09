/* ========================================
   1=GE Payment JavaScript
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
});

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

function showPaymentForm(serviceName, icon) {
    event.preventDefault();

    selectedService = serviceName;
    if (modalIcon) modalIcon.textContent = icon;
    if (modalServiceName) modalServiceName.textContent = serviceName;
    if (summaryService) summaryService.textContent = serviceName;

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
// Process Payment
// ========================================
const successModal = document.getElementById('success-modal');

function processPayment(event) {
    event.preventDefault();

    const amount = parseInt(amountInput.value);
    const balance = 30000; // Demo balance

    if (amount > balance) {
        alert(currentLang === 'kk' ? 'Жеткіліксіз қаражат!' : 'Недостаточно средств!');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#pay-form button[type="submit"]');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;

    // Simulate payment processing
    setTimeout(() => {
        closePaymentModal();

        // Show success
        if (successModal) {
            successModal.classList.add('active');
        }

        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }, 2000);
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
