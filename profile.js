/* ========================================
   1=GE Profile - Firebase Backend
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

// Apply saved theme
const savedTheme = localStorage.getItem('1ge-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Language toggle buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
    });
});

// Load cached user data IMMEDIATELY (before Firebase)
const cachedUser = localStorage.getItem('1ge-user');
if (cachedUser) {
    const userData = JSON.parse(cachedUser);
    const profileName = document.getElementById('profile-name');
    const profileAvatar = document.getElementById('profile-avatar');

    if (profileName && userData.name) {
        profileName.textContent = userData.name;
    }
    if (profileAvatar && userData.name) {
        const initials = userData.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        profileAvatar.textContent = initials;
    }
}

// Global state
let currentUser = null;
let userProfile = null;

// Check Authentication with Firebase
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('Profile page - User authenticated:', user.email);

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                userProfile = userDoc.data();
                userProfile.uid = user.uid;
                userProfile.email = user.email;

                loadProfile(userProfile);
                loadStats();
            } else {
                console.error('No user profile found');
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fall back to cache
            const cached = localStorage.getItem('1ge-user');
            if (cached) {
                userProfile = JSON.parse(cached);
                loadProfile(userProfile);
            }
        }
    } else {
        console.log('No user, redirecting to login...');
        window.location.href = 'login.html';
    }
});

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

    // Update email
    const infoPhone = document.getElementById('info-phone');
    if (infoPhone && userData.email) {
        infoPhone.textContent = userData.email;
    }

    // Update IIN (partially masked for security)
    const infoIin = document.getElementById('info-iin');
    if (infoIin && userData.iin) {
        const iin = userData.iin;
        const masked = iin.slice(0, 4) + ' XXXX ' + iin.slice(-4);
        infoIin.textContent = masked;
    }

    // Registration date
    const infoDate = document.getElementById('info-date');
    if (infoDate) {
        let regDate;
        if (userData.createdAt) {
            regDate = new Date(userData.createdAt);
        } else {
            regDate = new Date();
        }

        const months = currentLang === 'kk'
            ? ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
            : ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
        infoDate.textContent = `${months[regDate.getMonth()]} ${regDate.getFullYear()}`;
    }
}

// Load Stats from Firestore
async function loadStats() {
    const statTransactions = document.getElementById('stat-transactions');
    const statSpent = document.getElementById('stat-spent');
    const statRefills = document.getElementById('stat-refills');
    const statBalance = document.getElementById('stat-balance');

    if (!currentUser) {
        // Use cached data
        const cached = localStorage.getItem('1ge-transactions');
        const transactions = cached ? JSON.parse(cached) : [];

        if (statTransactions) statTransactions.textContent = transactions.length;
        if (statSpent) {
            const totalSpent = transactions
                .filter(tx => tx.type !== 'refill')
                .reduce((sum, tx) => sum + tx.amount, 0);
            statSpent.textContent = totalSpent.toLocaleString() + '₸';
        }
        if (statRefills) {
            const totalRefills = transactions
                .filter(tx => tx.type === 'refill')
                .reduce((sum, tx) => sum + tx.amount, 0);
            statRefills.textContent = totalRefills.toLocaleString() + '₸';
        }
        if (statBalance && userProfile) {
            statBalance.textContent = (userProfile.balance || 0).toLocaleString() + '₸';
        }
        return;
    }

    try {
        // Query transactions from Firestore
        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const transactions = [];

        snapshot.forEach(doc => {
            transactions.push(doc.data());
        });

        // Update stats
        if (statTransactions) {
            statTransactions.textContent = transactions.length;
        }

        if (statSpent) {
            const totalSpent = transactions
                .filter(tx => tx.type !== 'refill')
                .reduce((sum, tx) => sum + tx.amount, 0);
            statSpent.textContent = totalSpent.toLocaleString() + '₸';
        }

        if (statRefills) {
            const totalRefills = transactions
                .filter(tx => tx.type === 'refill')
                .reduce((sum, tx) => sum + tx.amount, 0);
            statRefills.textContent = totalRefills.toLocaleString() + '₸';
        }

        if (statBalance && userProfile) {
            statBalance.textContent = (userProfile.balance || 0).toLocaleString() + '₸';
        }

        console.log('Stats loaded:', transactions.length, 'transactions');

    } catch (error) {
        console.error('Error loading stats:', error);
        // Fall back to cached values
        if (statTransactions) statTransactions.textContent = '0';
        if (statSpent) statSpent.textContent = '0₸';
        if (statRefills) statRefills.textContent = '0₸';
        if (statBalance) statBalance.textContent = '0₸';
    }
}

// Logout with Firebase
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
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
// Edit Profile Modal
// ========================================
import { updateDoc, updatePassword } from './firebase-config.js';

const editProfileBtn = document.getElementById('edit-profile-btn');
const editModal = document.getElementById('edit-modal');
const editModalClose = document.getElementById('edit-modal-close');
const editForm = document.getElementById('edit-form');
const editNameInput = document.getElementById('edit-name');
const editEmailInput = document.getElementById('edit-email');

// Open edit modal
if (editProfileBtn && editModal) {
    editProfileBtn.addEventListener('click', () => {
        if (userProfile) {
            editNameInput.value = userProfile.name || '';
            editEmailInput.value = userProfile.email || '';
        }
        editModal.classList.add('active');
    });
}

// Close edit modal
if (editModalClose && editModal) {
    editModalClose.addEventListener('click', () => {
        editModal.classList.remove('active');
    });

    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.remove('active');
        }
    });
}

// Submit edit form
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newName = editNameInput.value.trim();
        if (!newName) return;

        const submitBtn = editForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span>';

        try {
            // Update name in Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                name: newName
            });

            // Update local state
            userProfile.name = newName;
            localStorage.setItem('1ge-user', JSON.stringify({
                ...JSON.parse(localStorage.getItem('1ge-user') || '{}'),
                name: newName
            }));

            // Update UI
            loadProfile(userProfile);

            // Close modal
            editModal.classList.remove('active');

            alert(currentLang === 'kk' ? '✅ Профиль сақталды!' : '✅ Профиль сохранён!');

        } catch (error) {
            console.error('Error updating profile:', error);
            alert(currentLang === 'kk' ? 'Қате орын алды' : 'Произошла ошибка');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span data-kk="Сақтау" data-ru="Сохранить">${currentLang === 'kk' ? 'Сақтау' : 'Сохранить'}</span>`;
        }
    });
}

// ========================================
// Change Password Modal
// ========================================
const changePasswordLink = document.getElementById('change-password-link');
const passwordModal = document.getElementById('password-modal');
const passwordModalClose = document.getElementById('password-modal-close');
const passwordForm = document.getElementById('password-form');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');

// Open password modal
if (changePasswordLink && passwordModal) {
    changePasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        passwordModal.classList.add('active');
    });
}

// Close password modal
if (passwordModalClose && passwordModal) {
    passwordModalClose.addEventListener('click', () => {
        passwordModal.classList.remove('active');
    });

    passwordModal.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.classList.remove('active');
        }
    });
}

// Submit password form
if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            alert(currentLang === 'kk' ? 'Құпия сөздер сәйкес келмейді' : 'Пароли не совпадают');
            return;
        }

        if (newPassword.length < 6) {
            alert(currentLang === 'kk' ? 'Құпия сөз кемінде 6 таңба болуы керек' : 'Пароль должен быть минимум 6 символов');
            return;
        }

        const submitBtn = passwordForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span>';

        try {
            // Update password in Firebase Auth
            await updatePassword(auth.currentUser, newPassword);

            // Close modal
            passwordModal.classList.remove('active');
            passwordForm.reset();

            alert(currentLang === 'kk' ? '✅ Құпия сөз өзгертілді!' : '✅ Пароль изменён!');

        } catch (error) {
            console.error('Error updating password:', error);

            if (error.code === 'auth/requires-recent-login') {
                alert(currentLang === 'kk' ? 'Қауіпсіздік себептерімен қайта кіріңіз' : 'Для смены пароля требуется перезайти');
            } else {
                alert(currentLang === 'kk' ? 'Қате орын алды' : 'Произошла ошибка');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span data-kk="Өзгерту" data-ru="Изменить">${currentLang === 'kk' ? 'Өзгерту' : 'Изменить'}</span>`;
        }
    });
}

// ========================================
// QR Code Generation (Simple SVG)
// ========================================
function generateQRCode(data) {
    // Simple QR-like pattern generator for demo
    const size = 25;
    const cellSize = 6;
    const totalSize = size * cellSize;

    // Create a pseudo-random but deterministic pattern based on data
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i);
        hash |= 0;
    }

    let svg = `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="white"/>`;

    // Position detection patterns (corners)
    const drawPositionPattern = (x, y) => {
        // Outer
        svg += `<rect x="${x}" y="${y}" width="${7 * cellSize}" height="${7 * cellSize}" fill="#10B981"/>`;
        svg += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" fill="white"/>`;
        svg += `<rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" fill="#10B981"/>`;
    };

    drawPositionPattern(0, 0);
    drawPositionPattern((size - 7) * cellSize, 0);
    drawPositionPattern(0, (size - 7) * cellSize);

    // Generate pattern based on hash
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            // Skip position pattern areas
            if ((row < 8 && col < 8) || (row < 8 && col >= size - 8) || (row >= size - 8 && col < 8)) continue;

            // Use hash to determine if cell is filled
            const idx = row * size + col;
            const filled = ((hash >> (idx % 32)) & 1) ^ ((hash >> ((idx + 7) % 32)) & 1);

            if (filled) {
                svg += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#10B981"/>`;
            }
        }
    }

    svg += '</svg>';
    return svg;
}

// Generate QR code for current user
const qrCodeContainer = document.getElementById('qr-code');
if (qrCodeContainer && currentUser) {
    setTimeout(() => {
        const paymentUrl = `https://1ge.pages.dev/pay?to=${currentUser.uid}`;
        qrCodeContainer.innerHTML = generateQRCode(paymentUrl);
    }, 1000);
}

// Share QR Code
const qrShareBtn = document.getElementById('qr-share-btn');
if (qrShareBtn) {
    qrShareBtn.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '1=GE Payment',
                    text: currentLang === 'kk' ? 'Маған 1=GE арқылы төлем жіберіңіз' : 'Отправьте мне платеж через 1=GE',
                    url: `https://1ge.pages.dev/pay?to=${currentUser?.uid || 'demo'}`
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy link
            const link = `https://1ge.pages.dev/pay?to=${currentUser?.uid || 'demo'}`;
            navigator.clipboard.writeText(link);
            alert(currentLang === 'kk' ? '✅ Сілтеме көшірілді!' : '✅ Ссылка скопирована!');
        }
    });
}

console.log('1=GE Profile loaded (Firebase mode)');
