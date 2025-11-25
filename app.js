// Minimal Apple-style MediTrack (No Firebase) with localStorage persistence

const STORAGE_KEY = "meditrack_demo_db_v1";

// initial sample dataset (20 entries)
const SAMPLE = [
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

// DOM handles
const screens = {
  login: document.getElementById("login-screen"),
  dashboard: document.getElementById("dashboard-screen")
};
const inventoryList = document.getElementById("inventory-list");
const tableEmpty = document.getElementById("table-empty");
const totalCountEl = document.getElementById("total-count");
const expiringCountEl = document.getElementById("expiring-count");
const expiredCountEl = document.getElementById("expired-count");
const lowCountEl = document.getElementById("low-stock-count");

const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");
const clearSearch = document.getElementById("clear-search");

const addBtn = document.getElementById("add-btn");
const modal = document.getElementById("modal-overlay");
const medForm = document.getElementById("med-form");
const cancelBtn = document.getElementById("cancel-btn");

const scanBtn = document.getElementById("scan-mode-btn");

// load db (localStorage fallback to SAMPLE)
let medicines = loadFromStorage();

// LOGIN button: opens dashboard
document.getElementById("login-btn").addEventListener("click", () => {
  screens.login.classList.add("hidden");
  screens.dashboard.classList.remove("hidden");
  renderAndStats();
});

// Settings/logout buttons (no real auth here)
document.getElementById("logout-btn").addEventListener("click", () => {
  // go back to 'login' screen
  screens.dashboard.classList.add("hidden");
  screens.login.classList.remove("hidden");
});

// search & filter
searchInput.addEventListener("input", applyFilters);
filterStatus.addEventListener("change", applyFilters);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  applyFilters();
});

// Add modal controls
addBtn.addEventListener("click", () => openModal());
cancelBtn.addEventListener("click", () => closeModal());
medForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("med-name").value.trim();
  const batch = document.getElementById("med-batch").value.trim();
  const date = document.getElementById("med-date").value;
  const qty = Number(document.getElementById("med-qty").value);

  if (!name || !batch || !date || Number.isNaN(qty)) {
    alert("Please fill all fields");
    return;
  }

  const newMed = {
    id: String(Date.now()),
    name, batchNumber: batch, expiryDate: date, quantity: qty
  };

  medicines.unshift(newMed); // add to top
  saveToStorage();
  closeModal();
  medForm.reset();
  applyFilters();
  updateStats(medicines);
});

// simple dummy barcode scan (prompt)
scanBtn.addEventListener("click", () => {
  const code = prompt("📷 Dummy scan — enter batch code (e.g. BATCH123):");
  if (!code) return;
  const result = medicines.find(m => m.batchNumber.toLowerCase().includes(code.toLowerCase()));
  if (result) {
    // set search and show table filtered to that item
    searchInput.value = result.name;
    applyFilters();
    // small visual confirmation
    animateFlash(result.id);
  } else {
    alert("No medicine found for: " + code);
  }
});

// open/close modal helpers
function openModal() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("med-name").focus();
}
function closeModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

// render and stats
function renderAndStats() {
  applyFilters();
  updateStats(medicines);
}

// apply filters/search
function applyFilters() {
  const term = (searchInput.value || "").toLowerCase().trim();
  const status = filterStatus.value;

  const filtered = medicines.filter(m => {
    const matches = m.name.toLowerCase().includes(term) || m.batchNumber.toLowerCase().includes(term);
    if (!matches) return false;
    if (status === "all") return true;
    return getStatus(m.expiryDate, m.quantity).type === status;
  });

  renderTable(filtered);
}

// render table rows
function renderTable(data) {
  inventoryList.innerHTML = "";
  if (!data.length) {
    tableEmpty.style.display = "block";
    return;
  }
  tableEmpty.style.display = "none";

  data.forEach(med => {
    const status = getStatus(med.expiryDate, med.quantity);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div style="font-weight:700">${escapeHtml(med.name)}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:6px">Batch: ${escapeHtml(med.batchNumber)}</div>
      </td>
      <td><span class="badge ${status.type}">${status.label}</span></td>
      <td>${escapeHtml(med.expiryDate)}</td>
      <td>${med.quantity}</td>
      <td style="text-align:right">
        <button class="btn subtle" data-id="${med.id}" title="Delete">🗑️</button>
      </td>
    `;

    inventoryList.appendChild(tr);
  });

  // attach delete handlers
  Array.from(inventoryList.querySelectorAll("button[data-id]")).forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      if (!confirm("Delete this medicine?")) return;
      medicines = medicines.filter(m => m.id !== id);
      saveToStorage();
      applyFilters();
      updateStats(medicines);
    });
  });
}

// compute status
function getStatus(dateString, qty) {
  const today = new Date();
  const expiry = new Date(dateString + "T00:00:00");
  const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return { type: "expired", label: "Expired" };
  if (diff <= 30) return { type: "warning", label: `Expires in ${diff}d` };
  if (qty <= 10) return { type: "low", label: "Low Stock" };
  return { type: "good", label: "Good" };
}

// update stats numbers
function updateStats(data) {
  totalCountEl.textContent = data.length;
  expiredCountEl.textContent = data.filter(m => getStatus(m.expiryDate, m.quantity).type === "expired").length;
  expiringCountEl.textContent = data.filter(m => getStatus(m.expiryDate, m.quantity).type === "warning").length;
  lowCountEl.textContent = data.filter(m => m.quantity <= 10).length;
}

// storage helpers
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
  } catch (e) {
    console.warn("storage failed", e);
  }
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // initial copy of sample
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE));
      return JSON.parse(JSON.stringify(SAMPLE));
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn("load failed", e);
    return JSON.parse(JSON.stringify(SAMPLE));
  }
}

// small visual flash for matched result (uses id if present)
function animateFlash(id) {
  // find row by batch or name (simple approach)
  const rows = Array.from(inventoryList.querySelectorAll("tr"));
  for (const r of rows) {
    if (r.textContent.toLowerCase().includes(id.toLowerCase()) || r.textContent.toLowerCase().includes(searchInput.value.toLowerCase())) {
      r.style.transition = "background 0.25s";
      r.style.background = "rgba(99,102,241,0.08)";
      setTimeout(() => r.style.background = "", 900);
      break;
    }
  }
}

// small helper to avoid XSS while injecting text
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// initial render
renderAndStats();
