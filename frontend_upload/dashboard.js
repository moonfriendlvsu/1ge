/* ========================================
   1=GE Dashboard - Firebase Firestore Backend
   ======================================== */

// Firebase imports
import {
    auth,
    db,
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from './firebase-config.js';

// ========================================
// Theme System
// ========================================
const savedTheme = localStorage.getItem('1ge-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    themeToggle.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('1ge-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    });
}

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
// Global state
// ========================================
let currentUser = null;
let userProfile = null;
let expenseChart = null;

// ========================================
// Check Authentication with Firebase
// ========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('User authenticated:', user.email);

        // Get user profile from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                userProfile = userDoc.data();
                console.log('User profile loaded:', userProfile);

                // Update local cache
                localStorage.setItem('1ge-user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: userProfile.name,
                    balance: userProfile.balance
                }));

                updateDashboard(userProfile);
                loadTransactions();
            } else {
                console.error('No user profile found');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fall back to local cache
            const cached = localStorage.getItem('1ge-user');
            if (cached) {
                userProfile = JSON.parse(cached);
                updateDashboard(userProfile);
            }
        }
    } else {
        console.log('No authenticated user, redirecting to login...');
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
        userName.classList.remove('skeleton', 'skeleton-text');
        userName.style.width = '';
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
        userAvatar.classList.remove('skeleton', 'skeleton-circle');
    }

    // Update balance
    const balance = userData.balance !== undefined ? userData.balance : 30000;
    const balanceValue = document.querySelector('.balance-value');
    if (balanceValue) {
        balanceValue.classList.remove('skeleton');
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
        limitText.classList.remove('skeleton', 'skeleton-text-sm');
        limitText.style.width = '';
    }

    console.log('Dashboard updated. Balance:', balance);
}

// ========================================
// Load Transactions from Firestore
// ========================================
async function loadTransactions() {
    const transactionsList = document.querySelector('.transactions-list');
    if (!transactionsList) return;

    // Show loading state - REMOVED to keep skeletons
    // transactionsList.innerHTML = `...`;

    try {
        if (!currentUser) {
            throw new Error('No authenticated user');
        }

        // Query transactions from Firestore
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc'),
            limit(10)
        );

        const snapshot = await getDocs(q);
        const transactions = [];

        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });

        console.log('Loaded transactions:', transactions.length);

        // Cache transactions locally
        localStorage.setItem('1ge-transactions', JSON.stringify(transactions));

        renderTransactions(transactions);
        initExpenseChart(transactions);

    } catch (error) {
        console.error('Error loading transactions:', error);

        // Fall back to local cache
        const cached = localStorage.getItem('1ge-transactions');
        const transactions = cached ? JSON.parse(cached) : [];
        renderTransactions(transactions);
        initExpenseChart(transactions);
    }
}

// ========================================
// Render Transactions List
// ========================================
function renderTransactions(transactions) {
    const transactionsList = document.querySelector('.transactions-list');
    if (!transactionsList) return;

    transactionsList.innerHTML = '';

    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="transaction-empty">
                <span>📭</span>
                <p data-kk="Транзакциялар жоқ" data-ru="Нет транзакций">Транзакциялар жоқ</p>
            </div>
        `;
        return;
    }

    transactions.forEach(tx => {
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
// Logout with Firebase
// ========================================
const logoutBtn = document.querySelector('.logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        try {
            await signOut(auth);
            localStorage.removeItem('1ge-user');
            localStorage.removeItem('1ge-transactions');
            console.log('User signed out');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect anyway
            localStorage.removeItem('1ge-user');
            window.location.href = '/';
        }
    });
}

// ========================================
// Expense Chart (Chart.js)
// ========================================
function initExpenseChart(transactions = []) {
    const ctx = document.getElementById('expense-chart');
    const legendContainer = document.getElementById('chart-legend');

    if (!ctx || !legendContainer) return;

    if (transactions.length === 0) {
        const chartContainer = ctx.parentElement;
        chartContainer.innerHTML = `
            <div class="chart-empty">
                <span>📊</span>
                <p data-kk="Шығындар жоқ" data-ru="Нет расходов">Шығындар жоқ</p>
            </div>
        `;
        legendContainer.innerHTML = '';
        return;
    }

    // Calculate spending by category
    const categories = {
        'Коммуналдық': { total: 0, color: '#10B981', icon: '🏠' },
        'Азық-түлік': { total: 0, color: '#0EA5E9', icon: '🛒' },
        'Дәріхана': { total: 0, color: '#F59E0B', icon: '💊' },
        'Басқа': { total: 0, color: '#8B5CF6', icon: '💳' }
    };

    // Map service names to categories
    const categoryMapping = {
        // Utilities
        'Алматы Энерго Сбыт': 'Коммуналдық',
        'ҚазТрансГаз': 'Коммуналдық',
        'Алматы Су': 'Коммуналдық',
        'Алатау Жылу': 'Коммуналдық',
        'Орал Энерго': 'Коммуналдық',
        'Шымкент Энерго': 'Коммуналдық',
        'КарагандыЖылуСбыт': 'Коммуналдық',
        'Астана Энерго': 'Коммуналдық',
        // Groceries
        'Magnum': 'Азық-түлік',
        'Small Market': 'Азық-түлік',
        'Арзан': 'Азық-түлік',
        'Анвар': 'Азық-түлік',
        // Pharmacy
        'Europharma': 'Дәріхана',
        'Sadykhan': 'Дәріхана',
        'Pharma Plus': 'Дәріхана'
    };

    transactions.forEach(tx => {
        if (tx.type !== 'refill') {
            const category = categoryMapping[tx.service] || 'Басқа';
            categories[category].total += tx.amount;
        }
    });

    // Filter out empty categories
    const activeCategories = Object.entries(categories).filter(([, data]) => data.total > 0);

    if (activeCategories.length === 0) {
        const chartContainer = ctx.parentElement;
        chartContainer.innerHTML = `
            <div class="chart-empty">
                <span>📊</span>
                <p data-kk="Шығындар жоқ" data-ru="Нет расходов">Шығындар жоқ</p>
            </div>
        `;
        legendContainer.innerHTML = '';
        return;
    }

    const labels = activeCategories.map(([name]) => name);
    const data = activeCategories.map(([, cat]) => cat.total);
    const colors = activeCategories.map(([, cat]) => cat.color);

    // Destroy existing chart if any
    if (expenseChart) {
        expenseChart.destroy();
    }

    // Create doughnut chart
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#0A0A0A',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return context.parsed.toLocaleString() + '₸';
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });

    // Build custom legend
    legendContainer.innerHTML = activeCategories.map(([name, cat]) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${cat.color}"></div>
            <span>${cat.icon} ${name}</span>
            <span class="legend-value">${cat.total.toLocaleString()}₸</span>
        </div>
    `).join('');
}

// Period buttons
document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ========================================
// Refill Balance Modal
// ========================================
import { updateDoc, addDoc, Timestamp } from './firebase-config.js';

const refillBtn = document.getElementById('refill-btn');
const refillModal = document.getElementById('refill-modal');
const refillModalClose = document.getElementById('refill-modal-close');
const refillAmountBtns = document.querySelectorAll('.refill-amount-btn');
const refillCustomInput = document.getElementById('refill-custom-amount');
const confirmRefillBtn = document.getElementById('confirm-refill');

let selectedRefillAmount = 20000; // Default amount

// Open modal
if (refillBtn && refillModal) {
    refillBtn.addEventListener('click', () => {
        refillModal.classList.add('active');
    });
}

// Close modal
if (refillModalClose && refillModal) {
    refillModalClose.addEventListener('click', () => {
        refillModal.classList.remove('active');
    });

    refillModal.addEventListener('click', (e) => {
        if (e.target === refillModal) {
            refillModal.classList.remove('active');
        }
    });
}

// Amount selection buttons
refillAmountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        refillAmountBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRefillAmount = parseInt(btn.dataset.amount);
        if (refillCustomInput) refillCustomInput.value = '';
    });
});

// Custom amount input
if (refillCustomInput) {
    refillCustomInput.addEventListener('input', () => {
        if (refillCustomInput.value) {
            refillAmountBtns.forEach(btn => btn.classList.remove('active'));
            selectedRefillAmount = parseInt(refillCustomInput.value) || 0;
        }
    });
}

// Confirm refill
if (confirmRefillBtn) {
    confirmRefillBtn.addEventListener('click', async () => {
        const amount = refillCustomInput?.value ? parseInt(refillCustomInput.value) : selectedRefillAmount;

        if (amount < 1000) {
            alert(currentLang === 'kk' ? 'Минимум 1000₸' : 'Минимум 1000₸');
            return;
        }

        if (amount > 500000) {
            alert(currentLang === 'kk' ? 'Максимум 500 000₸' : 'Максимум 500 000₸');
            return;
        }

        confirmRefillBtn.disabled = true;
        confirmRefillBtn.innerHTML = '<span>⏳</span>';

        try {
            // Update balance in Firestore
            const newBalance = (userProfile?.balance || 0) + amount;
            await updateDoc(doc(db, 'users', currentUser.uid), {
                balance: newBalance
            });

            // Add refill transaction
            await addDoc(collection(db, 'transactions'), {
                userId: currentUser.uid,
                type: 'refill',
                amount: amount,
                service: currentLang === 'kk' ? 'Баланс толтыру' : 'Пополнение',
                icon: '💰',
                date: new Date().toISOString(),
                createdAt: Timestamp.now()
            });

            // Update local state
            userProfile.balance = newBalance;
            localStorage.setItem('1ge-user', JSON.stringify({
                ...JSON.parse(localStorage.getItem('1ge-user') || '{}'),
                balance: newBalance
            }));

            // Update UI
            updateDashboard(userProfile);

            // Close modal and reload transactions
            refillModal.classList.remove('active');
            loadTransactions();

            // Show success
            setTimeout(() => {
                alert(currentLang === 'kk' ? `✅ ${amount.toLocaleString()}₸ сәтті толтырылды!` : `✅ ${amount.toLocaleString()}₸ успешно пополнено!`);
            }, 300);

        } catch (error) {
            console.error('Refill error:', error);
            alert(currentLang === 'kk' ? 'Қате орын алды' : 'Произошла ошибка');
        } finally {
            confirmRefillBtn.disabled = false;
            confirmRefillBtn.innerHTML = `<span data-kk="Толтыру" data-ru="Пополнить">${currentLang === 'kk' ? 'Толтыру' : 'Пополнить'}</span>`;
        }
    });
}

// ========================================
// Onboarding Tutorial
// ========================================
const onboardingModal = document.getElementById('onboarding-modal');
const onboardingSlides = document.querySelectorAll('.onboarding-slide');
const onboardingDots = document.querySelectorAll('.onboarding-dots .dot');
const onboardingNext = document.getElementById('onboarding-next');
const onboardingSkip = document.getElementById('onboarding-skip');

let currentSlide = 0;

function showSlide(index) {
    onboardingSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    onboardingDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Change button text on last slide
    if (index === onboardingSlides.length - 1) {
        onboardingNext.textContent = currentLang === 'kk' ? 'Бастау' : 'Начать';
    } else {
        onboardingNext.textContent = currentLang === 'kk' ? 'Келесі' : 'Далее';
    }
}

function closeOnboarding() {
    onboardingModal.classList.remove('active');
    localStorage.setItem('1ge-onboarding-done', 'true');
}

// Check if user needs onboarding
if (onboardingModal && !localStorage.getItem('1ge-onboarding-done')) {
    setTimeout(() => {
        onboardingModal.classList.add('active');
        setLanguage(currentLang); // Apply language to onboarding
    }, 500);
}

// Next button
if (onboardingNext) {
    onboardingNext.addEventListener('click', () => {
        if (currentSlide < onboardingSlides.length - 1) {
            currentSlide++;
            showSlide(currentSlide);
        } else {
            closeOnboarding();
        }
    });
}

// Skip button
if (onboardingSkip) {
    onboardingSkip.addEventListener('click', closeOnboarding);
}

// Dot navigation
onboardingDots.forEach(dot => {
    dot.addEventListener('click', () => {
        currentSlide = parseInt(dot.dataset.slide);
        showSlide(currentSlide);
    });
});

console.log('1=GE Dashboard loaded (Firebase mode)');
