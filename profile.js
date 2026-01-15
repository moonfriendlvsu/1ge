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

// Language toggle buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
    });
});

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

        console.log('Stats loaded:', transactions.length, 'transactions');

    } catch (error) {
        console.error('Error loading stats:', error);
        // Fall back to cached values
        if (statTransactions) statTransactions.textContent = '0';
        if (statSpent) statSpent.textContent = '0₸';
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

console.log('1=GE Profile loaded (Firebase mode)');
