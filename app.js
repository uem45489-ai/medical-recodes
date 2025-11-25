// -------------------------------------------------------
// SIMPLE DUMMY VERSION (NO FIREBASE, NO AUTH)
// -------------------------------------------------------

// Dummy medicine data
let medicines = [
    {
        id: "1",
        name: "Paracetamol",
        batchNumber: "BATCH123",
        expiryDate: "2025-05-10",
        quantity: 20
    },
    {
        id: "2",
        name: "Amoxicillin",
        batchNumber: "AMX456",
        expiryDate: "2024-12-01",
        quantity: 5
    },
    {
        id: "3",
        name: "Cetirizine",
        batchNumber: "CTZ789",
        expiryDate: "2023-12-10",
        quantity: 0
    }
];

// DOM elements
const screens = {
    login: document.getElementById("login-screen"),
    dashboard: document.getElementById("dashboard-screen")
};

const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");

// -------------------------------------------------------
// OPEN DASHBOARD INSTANTLY (No login required)
// -------------------------------------------------------
document.getElementById("login-btn").addEventListener("click", () => {
    screens.login.classList.add("hidden");
    screens.dashboard.classList.remove("hidden");

    loadMedicines();
});

// -------------------------------------------------------
// LOAD DUMMY DATA
// -------------------------------------------------------
function loadMedicines() {
    applyFilters();
    updateStats(medicines);
}

// -------------------------------------------------------
// FILTER + SEARCH
// -------------------------------------------------------
searchInput.addEventListener("input", applyFilters);
filterStatus.addEventListener("change", applyFilters);

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;

    const filtered = medicines.filter(med => {
        const matches =
            med.name.toLowerCase().includes(term) ||
            med.batchNumber.toLowerCase().includes(term);

        if (!matches) return false;

        if (statusFilter === "all") return true;

        return getStatus(med.expiryDate, med.quantity).type === statusFilter;
    });

    renderTable(filtered);
}

// -------------------------------------------------------
// RENDER TABLE
// -------------------------------------------------------
function renderTable(data) {
    const list = document.getElementById("inventory-list");
    list.innerHTML = "";

    data.forEach(med => {
        const status = getStatus(med.expiryDate, med.quantity);

        list.innerHTML += `
            <tr>
                <td>
                    <strong>${med.name}</strong><br>
                    <span style="font-size:0.75rem;color:#64748b">Batch: ${med.batchNumber}</span>
                </td>
                <td><span class="badge ${status.type}">${status.label}</span></td>
                <td>${med.expiryDate}</td>
                <td>${med.quantity}</td>
                <td style="text-align:right">
                    <button onclick="deleteMed('${med.id}')">🗑️</button>
                </td>
            </tr>
        `;
    });
}

// -------------------------------------------------------
// STATUS LOGIC
// -------------------------------------------------------
function getStatus(dateString, qty) {
    const today = new Date();
    const expiry = new Date(dateString);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { type: "expired", label: "Expired" };
    if (diff <= 30) return { type: "warning", label: `Expires in ${diff}d` };
    if (qty <= 10) return { type: "low", label: "Low Stock" };
    return { type: "good", label: "Good" };
}

// -------------------------------------------------------
// STATS
// -------------------------------------------------------
function updateStats(data) {
    document.getElementById("total-count").innerText = data.length;
    document.getElementById("expired-count").innerText = data.filter(m => getStatus(m.expiryDate, m.quantity).type === "expired").length;
    document.getElementById("expiring-count").innerText = data.filter(m => getStatus(m.expiryDate, m.quantity).type === "warning").length;
    document.getElementById("low-stock-count").innerText = data.filter(m => m.quantity <= 10).length;
}

// -------------------------------------------------------
// DELETE MEDICINE (Dummy)
// -------------------------------------------------------
function deleteMed(id) {
    medicines = medicines.filter(m => m.id !== id);
    applyFilters();
    updateStats(medicines);
}
