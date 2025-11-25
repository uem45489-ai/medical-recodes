// -------------------------------------------------------
// DEMO VERSION (NO FIREBASE, DUMMY DATABASE)
// -------------------------------------------------------

let medicines = [
    { id: "1", name: "Paracetamol", batchNumber: "BATCH123", expiryDate: "2025-05-10", quantity: 20 },
    { id: "2", name: "Amoxicillin", batchNumber: "AMX456", expiryDate: "2024-12-01", quantity: 5 },
    { id: "3", name: "Cetirizine", batchNumber: "CTZ789", expiryDate: "2023-12-10", quantity: 0 },
    { id: "4", name: "Ibuprofen", batchNumber: "IBU001", expiryDate: "2026-03-20", quantity: 15 },
    { id: "5", name: "Aspirin", batchNumber: "ASP002", expiryDate: "2024-06-14", quantity: 8 },
    { id: "6", name: "Azithromycin", batchNumber: "AZT333", expiryDate: "2025-09-30", quantity: 12 },
    { id: "7", name: "Vitamin C", batchNumber: "VTC555", expiryDate: "2027-01-01", quantity: 40 },
    { id: "8", name: "Metformin", batchNumber: "MTF444", expiryDate: "2024-11-22", quantity: 6 },
    { id: "9", name: "Omeprazole", batchNumber: "OMP112", expiryDate: "2025-02-10", quantity: 30 },
    { id: "10", name: "Doxycycline", batchNumber: "DOX908", expiryDate: "2023-12-01", quantity: 2 },
    { id: "11", name: "Pantoprazole", batchNumber: "PNT200", expiryDate: "2026-07-14", quantity: 18 },
    { id: "12", name: "Ranitidine", batchNumber: "RNT350", expiryDate: "2024-01-10", quantity: 9 },
    { id: "13", name: "Cough Syrup", batchNumber: "CS999", expiryDate: "2025-03-03", quantity: 25 },
    { id: "14", name: "Antacid", batchNumber: "ANT121", expiryDate: "2023-12-15", quantity: 3 },
    { id: "15", name: "Calcium Tablets", batchNumber: "CAL555", expiryDate: "2027-05-10", quantity: 50 },
    { id: "16", name: "Insulin", batchNumber: "INS800", expiryDate: "2024-04-05", quantity: 7 },
    { id: "17", name: "Steroid Cream", batchNumber: "STC777", expiryDate: "2025-10-01", quantity: 4 },
    { id: "18", name: "ORS Packets", batchNumber: "ORS333", expiryDate: "2026-01-20", quantity: 60 },
    { id: "19", name: "Zincovit", batchNumber: "ZCV888", expiryDate: "2025-12-11", quantity: 22 },
    { id: "20", name: "Montelukast", batchNumber: "MTL909", expiryDate: "2025-08-14", quantity: 11 }
];

// DOM
const screens = {
    login: document.getElementById("login-screen"),
    dashboard: document.getElementById("dashboard-screen")
};

const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");

// -------------------------------------------------------
// LOGIN → OPEN DASHBOARD
// -------------------------------------------------------
document.getElementById("login-btn").addEventListener("click", () => {
    screens.login.classList.add("hidden");
    screens.dashboard.classList.remove("hidden");

    loadMedicines();
});

// -------------------------------------------------------
// LOAD DATA
// -------------------------------------------------------
function loadMedicines() {
    document.getElementById("loading-spinner").style.display = "none";
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
        const matches = med.name.toLowerCase().includes(term) ||
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
// DELETE
// -------------------------------------------------------
function deleteMed(id) {
    medicines = medicines.filter(m => m.id !== id);
    applyFilters();
    updateStats(medicines);
}

// -------------------------------------------------------
// ADD MEDICINE MODAL
// -------------------------------------------------------
const addBtn = document.getElementById("add-btn");
const addModal = document.getElementById("add-modal");
const closeAdd = document.getElementById("close-add");
const addForm = document.getElementById("add-form");

addBtn.addEventListener("click", () => {
    addModal.classList.remove("hidden");
});

closeAdd.addEventListener("click", () => {
    addModal.classList.add("hidden");
});

addForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newMed = {
        id: String(Date.now()),
        name: document.getElementById("add-name").value,
        batchNumber: document.getElementById("add-batch").value,
        expiryDate: document.getElementById("add-expiry").value,
        quantity: Number(document.getElementById("add-qty").value)
    };

    medicines.push(newMed);
    addModal.classList.add("hidden");
    addForm.reset();

    applyFilters();
    updateStats(medicines);
});

// -------------------------------------------------------
// BARCODE SCAN (DUMMY)
// -------------------------------------------------------
document.getElementById("scan-mode-btn").addEventListener("click", () => {
    const code = prompt("📷 Enter dummy barcode (Batch No.):");

    if (!code) return;

    const result = medicines.find(m =>
        m.batchNumber.toLowerCase().includes(code.toLowerCase())
    );

    if (result) {
        alert("Found: " + result.name);
        searchInput.value = result.name;
        applyFilters();
    } else {
        alert("No medicine found for barcode: " + code);
    }
});
