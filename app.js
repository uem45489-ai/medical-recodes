// Extracted JavaScript (Firebase + App Logic)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signOut, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Config (Injected at Runtime)
const firebaseConfig = JSON.parse(__firebase_config);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let medicines = [];  
let unsubscribeMeds = null;
let userSettings = { threshold: 30, notifications: false };
let hasCheckedEmpty = false;

// DOM Elements
const screens = {
    login: document.getElementById('login-screen'),
    dashboard: document.getElementById('dashboard-screen')
};

const modals = {
    med: document.getElementById('modal-overlay'),
    settings: document.getElementById('settings-modal')
};

const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');

// AUTH ------------------------------------------------------
async function initAuth() {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
    }
}
initAuth();

document.getElementById('login-btn').addEventListener('click', async () => {
    await signInAnonymously(auth);
});

document.getElementById('logout-btn').addEventListener('click', () => {
    if (unsubscribeMeds) unsubscribeMeds();
    signOut(auth);
    hasCheckedEmpty = false;
});

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
        screens.login.classList.add('hidden');
        screens.dashboard.classList.remove('hidden');
        await loadSettings();
        loadMedicines();
    } else {
        screens.login.classList.remove('hidden');
        screens.dashboard.classList.add('hidden');
    }
});

// SETTINGS ------------------------------------------------------
async function loadSettings() {
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'preferences');
        const snap = await getDoc(docRef);
        if (snap.exists()) userSettings = { ...userSettings, ...snap.data() };
        document.getElementById('setting-threshold').value = userSettings.threshold;
        document.getElementById('setting-notifications').checked = userSettings.notifications;
    } catch (e) { console.log('Default settings used'); }
}

document.getElementById('settings-btn').addEventListener('click', () => modals.settings.classList.remove('hidden'));

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newSettings = {
        threshold: Number(document.getElementById('setting-threshold').value),
        notifications: document.getElementById('setting-notifications').checked
    };
    await setDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'preferences'), newSettings);
    userSettings = newSettings;
    modals.settings.classList.add('hidden');
});

// MEDICINE LOAD ----------------------------------------------------
function loadMedicines() {
    const medsRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'medicines');

    unsubscribeMeds = onSnapshot(medsRef, (snapshot) => {
        medicines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        medicines.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        applyFilters();
        updateStats(medicines);
    });
}

// FILTER + SEARCH -----------------------------------------------
searchInput.addEventListener('input', applyFilters);
filterStatus.addEventListener('change', applyFilters);

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;

    const filtered = medicines.filter(med => {
        const matches = med.name.toLowerCase().includes(term) ||
                        med.batchNumber.toLowerCase().includes(term);
        if (!matches) return false;

        if (statusFilter === 'all') return true;
        return getStatus(med.expiryDate, med.quantity).type === statusFilter;
    });

    renderTable(filtered);
}

// TABLE RENDER ---------------------------------------------------
function renderTable(data) {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';

    data.forEach(med => {
        const status = getStatus(med.expiryDate, med.quantity);
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <strong>${med.name}</strong><br>
                <span style="font-size:0.75rem;color:#64748b">Batch: ${med.batchNumber}</span>
            </td>
            <td><span class="badge ${status.type}">${status.label}</span></td>
            <td>${med.expiryDate}</td>
            <td>${med.quantity}</td>
            <td style="text-align:right">
                <button onclick="window.deleteMed('${med.id}')">🗑️</button>
            </td>
        `;

        list.appendChild(row);
    });
}

// STATUS ---------------------------------------------------------
function getStatus(dateString, qty) {
    const today = new Date();
    const expiry = new Date(dateString);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { type: 'expired', label: 'Expired' };
    if (diff <= userSettings.threshold) return { type: 'warning', label: `Expires in ${diff}d` };
    if (qty <= 10) return { type: 'low', label: 'Low Stock' };
    return { type: 'good', label: 'Good' };
}

// STATS ----------------------------------------------------------
function updateStats(data) {
    let total = data.length;
    let expired = data.filter(m => getStatus(m.expiryDate, m.quantity).type === 'expired').length;
    let soon = data.filter(m => getStatus(m.expiryDate, m.quantity).type === 'warning').length;
    let low = data.filter(m => m.quantity <= 10).length;

    document.getElementById('total-count').innerText = total;
    document.getElementById('expired-count').innerText = expired;
    document.getElementById('expiring-count').innerText = soon;
    document.getElementById('low-stock-count').innerText = low;
}

// DELETE ----------------------------------------------------------
window.deleteMed = async (id) => {
    if (confirm('Delete this medicine?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'medicines', id));
    }
};
