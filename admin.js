const ADMIN_EMAIL = "admin@cafeteria.com";
const ADMIN_PASSWORD = "Admin123";
const ORDERS_KEY = "cafeteriaLosTresIngOrders";
const WORKERS_KEY = "cafeteriaLosTresIngWorkers";
const ADMIN_SESSION_KEY = "cafeteriaLosTresIngAdmin";
const ADMIN_ROLE_KEY = "cafeteriaLosTresIngAdminRole";

const loginSection = document.getElementById("adminLogin");
const dashboard = document.getElementById("adminDashboard");
const ordersContainer = document.getElementById("adminOrders");
const workerManagement = document.getElementById("workerManagement");
const workerForm = document.getElementById("workerForm");
const workerList = document.getElementById("workerList");
const workerMessage = document.getElementById("workerMessage");

let selectedStatus = "Todos";
let currentRole = "admin";

const money = amount => Number(amount || 0).toLocaleString("es-MX", {
  style: "currency",
  currency: "MXN"
});

function getOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getWorkers() {
  try {
    const workers = JSON.parse(localStorage.getItem(WORKERS_KEY) || "[]");
    return Array.isArray(workers) ? workers : [];
  } catch {
    return [];
  }
}

function saveWorkers(workers) {
  localStorage.setItem(WORKERS_KEY, JSON.stringify(workers));
}

function showDashboard(role = "admin") {
  currentRole = role;
  loginSection.hidden = true;
  dashboard.hidden = false;
  workerManagement.hidden = currentRole !== "admin";
  if (currentRole === "admin") renderWorkers();
  renderOrders();
}

document.getElementById("adminLoginForm").addEventListener("submit", event => {
  event.preventDefault();
  const email = document.getElementById("adminEmail").value.trim().toLowerCase();
  const password = document.getElementById("adminPassword").value;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    sessionStorage.setItem(ADMIN_ROLE_KEY, "admin");
    showDashboard("admin");
    return;
  }

  const worker = getWorkers().find(item =>
    item.email === email && item.password === password
  );

  if (worker) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    sessionStorage.setItem(ADMIN_ROLE_KEY, "worker");
    showDashboard("worker");
  } else {
    document.getElementById("adminMessage").textContent =
      "Correo o contraseña incorrectos.";
  }
});

function renderWorkers() {
  const workers = getWorkers();
  if (!workers.length) {
    workerList.innerHTML =
      '<div class="worker-empty">Todavía no hay cuentas de trabajadores registradas.</div>';
    return;
  }

  workerList.innerHTML = workers.map((worker, index) => `
    <article class="worker-card">
      <div>
        <strong>${escapeHTML(worker.fullName || "Trabajador")}</strong>
        <small>${escapeHTML(worker.email || "")}</small>
      </div>
      <button class="worker-delete" type="button" data-worker-index="${index}">
        Eliminar cuenta
      </button>
    </article>
  `).join("");
}

workerForm.addEventListener("submit", event => {
  event.preventDefault();
  if (currentRole !== "admin") return;

  const fullName = document.getElementById("workerName").value.trim();
  const email = document.getElementById("workerEmail").value.trim().toLowerCase();
  const password = document.getElementById("workerPassword").value;

  if (!fullName || !email || password.length < 4) {
    workerMessage.textContent =
      "Completa los datos. La contraseña debe tener al menos 4 caracteres.";
    return;
  }

  if (email === ADMIN_EMAIL || getWorkers().some(worker => worker.email === email)) {
    workerMessage.textContent = "Ya existe una cuenta con ese correo.";
    return;
  }

  const workers = getWorkers();
  workers.push({ fullName, email, password });
  saveWorkers(workers);
  workerForm.reset();
  workerMessage.textContent = "La cuenta del trabajador se creó correctamente.";
  renderWorkers();
});

workerList.addEventListener("click", event => {
  const deleteButton = event.target.closest("[data-worker-index]");
  if (!deleteButton || currentRole !== "admin") return;

  const index = Number(deleteButton.dataset.workerIndex);
  const workers = getWorkers();
  const worker = workers[index];
  if (!worker) return;

  if (!window.confirm(
    `¿Estás seguro de que deseas eliminar la cuenta de ${worker.fullName || worker.email}?\n\nEsta acción no se puede deshacer.`
  )) return;

  workers.splice(index, 1);
  saveWorkers(workers);
  workerMessage.textContent = "La cuenta del trabajador se eliminó correctamente.";
  renderWorkers();
});

function renderOrders() {
  const orders = getOrders();
  const cancelled = orders.filter(order => order.status === "Cancelado").length;
  const completed = orders.filter(order => order.status === "Completado").length;
  const active = orders.filter(order =>
    !["Cancelado", "Completado"].includes(order.status)
  ).length;

  document.getElementById("totalOrders").textContent = orders.length;
  document.getElementById("activeOrders").textContent = active;
  document.getElementById("cancelledOrders").textContent = cancelled;

  const filtered = selectedStatus === "Todos"
    ? orders
    : orders.filter(order => (order.status || "Pendiente") === selectedStatus);

  const descriptions = {
    "Todos": "Todos los pedidos de la cafetería.",
    "Pendiente": "Pedidos recibidos que aún no se comienzan.",
    "En proceso": "Pedidos que se están preparando.",
    "Completado": "Pedidos que ya están listos.",
    "Cancelado": "Pedidos que fueron cancelados."
  };
  document.getElementById("ordersDescription").textContent =
    descriptions[selectedStatus] || descriptions["Todos"];

  if (!filtered.length) {
    ordersContainer.innerHTML =
      '<div class="admin-empty">No hay pedidos en esta sección todavía.</div>';
    return;
  }

  ordersContainer.innerHTML = filtered.map(order => {
    const status = order.status || "Pendiente";
    const statusClass = status === "Cancelado" ? "cancelled"
      : status === "Completado" ? "completed"
      : status === "En proceso" ? "processing" : "pending";
    const canUpdate = status !== "Cancelado" && status !== "Completado";

    return `
      <article class="admin-order-card">
        <div class="admin-order-top">
          <div>
            <strong>${escapeHTML(order.ticketNumber || order.id || "Pedido")}</strong>
            <small>${escapeHTML(order.date || "Sin fecha")}</small>
          </div>
          <span class="order-status ${statusClass}">${escapeHTML(status)}</span>
        </div>
        <div class="admin-customer">
          <strong>${escapeHTML(order.customer || "Cliente")}</strong>
          <span>${escapeHTML(order.email || "")}</span>
        </div>
        <div class="admin-order-items">
          ${(order.items || []).map(item => `
            <div>
              <span>${escapeHTML(item.name)} × ${Number(item.quantity || 0)}</span>
              <strong>${money(item.subtotal)}</strong>
            </div>
          `).join("")}
        </div>
        <div class="admin-order-bottom">
          <span>Total del pedido</span>
          <strong>${money(order.total)}</strong>
        </div>
        ${status === "Cancelado"
          ? `<small class="cancelled-date">Cancelado: ${escapeHTML(order.cancelledAt || "Fecha no disponible")}</small>`
          : ""}
        ${canUpdate ? `
          <div class="order-status-actions">
            <button type="button" class="status-progress-btn"
              data-order-id="${escapeHTML(order.id || order.ticketNumber)}"
              data-new-status="En proceso" ${status === "En proceso" ? "disabled" : ""}>
              ${status === "En proceso" ? "✓ En proceso" : "Marcar en proceso"}
            </button>
            <button type="button" class="status-complete-btn"
              data-order-id="${escapeHTML(order.id || order.ticketNumber)}"
              data-new-status="Completado">
              Marcar como completado
            </button>
          </div>
        ` : status === "Completado"
          ? '<p class="status-current-note">✓ Este pedido ya fue completado.</p>'
          : ""}
      </article>
    `;
  }).join("");
}

ordersContainer.addEventListener("click", event => {
  const button = event.target.closest("[data-new-status]");
  if (!button) return;

  const orderId = button.dataset.orderId;
  const newStatus = button.dataset.newStatus;
  const orders = getOrders();
  const order = orders.find(item =>
    String(item.id || item.ticketNumber) === String(orderId)
  );

  if (!order || order.status === "Cancelado" || order.status === "Completado") return;
  if (!["En proceso", "Completado"].includes(newStatus)) return;

  order.status = newStatus;
  order.statusUpdatedAt = new Date().toLocaleString("es-MX");
  saveOrders(orders);
  renderOrders();
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

document.querySelectorAll(".admin-filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".admin-filter").forEach(item =>
      item.classList.remove("active")
    );
    button.classList.add("active");
    selectedStatus = button.dataset.status;
    renderOrders();
  });
});

document.getElementById("adminLogout").addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_ROLE_KEY);
  dashboard.hidden = true;
  loginSection.hidden = false;
  document.getElementById("adminLoginForm").reset();
  document.getElementById("adminMessage").textContent = "";
});

if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
  showDashboard(sessionStorage.getItem(ADMIN_ROLE_KEY) || "admin");
}

// Actualiza los pedidos si otro usuario los modifica en otra pestaña del mismo navegador.
window.addEventListener("storage", event => {
  if (event.key === ORDERS_KEY && !dashboard.hidden) renderOrders();
});
