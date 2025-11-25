// ---------- DUMMY DATA ----------
let medicines = [
    { id: "1", name: "Paracetamol", batchNumber: "BATCH123", expiryDate: "2025-05-10", quantity: 20 },
    { id: "2", name: "Amoxicillin", batchNumber: "AMX456", expiryDate: "2024-12-01", quantity: 5 },
    { id: "3", name: "Cetirizine", batchNumber: "CTZ789", expiryDate: "2023-12-10", quantity: 0 },
];


// ---------- ELEMENTS ----------
const addBtn = document.getElementById("add-btn");
const addModal = document.getElementById("add-modal");
const closeAdd = document.getElementById("close-add");
const modalBackdrop = document.getElementById("modal-backdrop");
const addForm = document.getElementById("add-form");
const inventoryList = document.getElementById("inventory-list");
const emptyState = document.getElementById("table-empty");
const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");


// ---------- OPEN MODAL ----------
addBtn.addEventListener("click", () => {
    addModal.classList.remove("hidden");
});


// ---------- CLOSE MODAL ----------
closeAdd.addEventListener("click", () => {
    addModal.classList.add("hidden");
});

modalBackdrop.addEventListener("click", () => {
    addModal.classList.add("hidden");
});


// ---------- RENDER TABLE ----------
function renderTable(filtered = medicines) {
    inventoryList.innerHTML = "";

    if (filtered.length === 0) {
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    filtered.forEach(med => {
        const status = getStatus(med.expiryDate, med.quantity);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>${med.name}</strong><br>
                <span style="font-size:12px;opacity:0.6;">Batch: ${med.batchNumber}</span>
            </td>
            <td><span class="badge ${status.type}">${status.label}</span></td>
            <td>${med.expiryDate}</td>
            <td>${med.quantity}</td>
            <td style="text-align:right"><button onclick="deleteMed('${med.id}')" class="icon-btn">🗑️</button></td>
        `;

        inventoryList.appendChild(row);
    });

    updateStats();
}

renderTable();


// ---------- MEDICINE STATUS ----------
function getStatus(dateString, qty) {
    const today = new Date();
    const expiry = new Date(dateString);
    const diff = Math.ceil((expiry - today) / (1000*60*60*24));

    if (diff < 0) return { type: "expired", label: "Expired" };
    if (diff <= 30) return { type: "warning", label: `Expiring Soon` };
    if (qty <= 10) return { type: "low", label: "Low Stock" };
    return { type: "good", label: "Good" };
}


// ---------- ADD NEW MEDICINE ----------
addForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const med = {
        id: String(Date.now()),
        name: document.getElementById("add-name").value,
        batchNumber: document.getElementById("add-batch").value,
        expiryDate: document.getElementById("add-expiry").value,
        quantity: Number(document.getElementById("add-qty").value)
    };

    medicines.push(med);

    addModal.classList.add("hidden");
    addForm.reset();

    applyFilters();
});


// ---------- DELETE MEDICINE ----------
window.deleteMed = (id) => {
    medicines = medicines.filter(m => m.id !== id);
    applyFilters();
};


// ---------- STATS ----------
function updateStats() {
    document.getElementById("total-count").innerText = medicines.length;
    document.getElementById("expired-count").innerText =
        medicines.filter(m => getStatus(m.expiryDate, m.quantity).type === "expired").length;
    document.getElementById("expiring-count").innerText =
        medicines.filter(m => getStatus(m.expiryDate, m.quantity).type === "warning").length;
    document.getElementById("low-stock-count").innerText =
        medicines.filter(m => m.quantity <= 10).length;
}


// ---------- SEARCH & FILTER ----------
searchInput.addEventListener("input", applyFilters);
filterStatus.addEventListener("change", applyFilters);

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const status = filterStatus.value;

    const filtered = medicines.filter(med => {
        const matches = med.name.toLowerCase().includes(term)
                     || med.batchNumber.toLowerCase().includes(term);

        if (!matches) return false;

        if (status === "all") return true;

        return getStatus(med.expiryDate, med.quantity).type === status;
    });

    renderTable(filtered);
}

