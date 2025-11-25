let medicines = JSON.parse(localStorage.getItem("medicines") || "[]");

const list = document.getElementById("inventory-list");
const empty = document.getElementById("table-empty");

function save() {
    localStorage.setItem("medicines", JSON.stringify(medicines));
}

function refresh() {
    list.innerHTML = "";
    empty.style.display = medicines.length ? "none" : "block";

    medicines.forEach((m, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${m.name}</strong><br><small>Batch: ${m.batch}</small></td>
            <td>${m.status}</td>
            <td>${m.expiry}</td>
            <td>${m.qty}</td>
            <td style="text-align:right"><button onclick="delMed(${i})">🗑️</button></td>
        `;
        list.appendChild(tr);
    });

    document.getElementById("total-count").innerText = medicines.length;
    document.getElementById("expired-count").innerText =
        medicines.filter(m => m.status === "Expired").length;
    document.getElementById("expiring-count").innerText =
        medicines.filter(m => m.status === "Expiring Soon").length;
    document.getElementById("low-stock-count").innerText =
        medicines.filter(m => parseInt(m.qty) <= 10).length;
}

function statusOf(date, qty) {
    const d = new Date(date);
    const today = new Date();
    const diff = (d - today) / (1000 * 60 * 60 * 24);

    if (diff < 0) return "Expired";
    if (diff <= 30) return "Expiring Soon";
    if (qty <= 10) return "Low Stock";
    return "Good";
}

function delMed(i) {
    medicines.splice(i, 1);
    save();
    refresh();
}

/* Modal */
const modal = document.getElementById("modal-overlay");
document.getElementById("add-btn").onclick = () => modal.classList.remove("hidden");
document.getElementById("cancel-btn").onclick = () => modal.classList.add("hidden");

document.getElementById("med-form").onsubmit = (e) => {
    e.preventDefault();
    const name = med-name.value;
    const batch = med-batch.value;
    const expiry = med-date.value;
    const qty = med-qty.value;

    medicines.push({
        name, batch, expiry, qty,
        status: statusOf(expiry, qty)
    });

    save();
    refresh();
    modal.classList.add("hidden");
};

/* Search */
const search = document.getElementById("search-input");
search.addEventListener("input", () => {
    const term = search.value.toLowerCase();
    Array.from(list.children).forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? "" : "none";
    });
});
document.getElementById("clear-search").onclick = () => {
    search.value = "";
    search.dispatchEvent(new Event("input"));
};

/* Filter */
document.getElementById("filter-status").addEventListener("change", function () {
    const val = this.value;
    Array.from(list.children).forEach(row => {
        row.style.display =
            val === "all" || row.cells[1].innerText.toLowerCase().includes(val)
                ? ""
                : "none";
    });
});

/* Scan Button */
document.getElementById("scan-mode-btn").onclick = () => {
    const code = prompt("📷 Enter barcode / batch number:");
    if (!code) return;

    const found = medicines.find(m =>
        m.batch.toLowerCase() === code.toLowerCase() ||
        m.name.toLowerCase().includes(code.toLowerCase())
    );

    if (!found) {
        alert("❌ No medicine found!");
        return;
    }

    search.value = found.batch;
    search.dispatchEvent(new Event("input"));
    alert("✅ Found: " + found.name);
};

refresh();
