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
            <td style="text-align:right">
                <button onclick="delMed(${i})">🗑️</button>
            </td>
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

/* ------------------------ MODAL ------------------------ */

const modal = document.getElementById("modal-overlay");
document.getElementById("add-btn").onclick = () => {
    modal.classList.remove("hidden");
};

document.getElementById("cancel-btn").onclick = () => {
    modal.classList.add("hidden");
};

/* ------------------------ FIXED SAVE BUTTON ------------------------ */

document.getElementById("med-form").addEventListener("submit", (e) => {
    e.preventDefault();

    // FIX: IDs matched with HTML
    const name = document.getElementById("med-name").value.trim();
    const batch = document.getElementById("med-batch").value.trim();
    const expiry = document.getElementById("med-date").value;
    const qty = document.getElementById("med-qty").value;

    if (!name || !batch || !expiry || !qty) {
        alert("Please fill all fields!");
        return;
    }

    medicines.push({
        name,
        batch,
        expiry,
        qty,
        status: statusOf(expiry, qty)
    });

    save();
    refresh();
    modal.classList.add("hidden");

    document.getElementById("med-form").reset();
});

/* ------------------------ SEARCH ------------------------ */

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

/* ------------------------ FILTER ------------------------ */

document.getElementById("filter-status").addEventListener("change", function () {
    const val = this.value;
    Array.from(list.children).forEach(row => {
        row.style.display =
            val === "all" || row.cells[1].innerText.toLowerCase().includes(val)
                ? ""
                : "none";
    });
});

/* ------------------------ SCAN BUTTON ------------------------ */

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
