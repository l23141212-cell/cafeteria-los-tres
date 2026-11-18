const products = [
  { id: 1, name: "Espresso", category: "Café", type: "Café", description: "Intenso, aromático y recién preparado.", price: 35, emoji: "☕" },
  { id: 2, name: "Cappuccino", category: "Café", type: "Café", description: "Café espresso con leche espumosa.", price: 49, emoji: "🥛" },
  { id: 3, name: "Latte Vainilla", category: "Café", type: "Café", description: "Suave, cremoso y con toque de vainilla.", price: 55, emoji: "🤎" },
  { id: 4, name: "Frappé de Café", category: "Fríos", type: "Bebidas frías", description: "Café frío, cremoso y refrescante.", price: 62, emoji: "🧋" },
  { id: 5, name: "Chocolate Frío", category: "Fríos", type: "Bebidas frías", description: "Chocolate con leche y mucho sabor.", price: 58, emoji: "🍫" },
  { id: 6, name: "Cheesecake", category: "Postres", type: "Postres", description: "Rebanada cremosa con base crujiente.", price: 65, emoji: "🍰" },
  { id: 7, name: "Brownie", category: "Postres", type: "Postres", description: "Chocolate intenso en cada bocado.", price: 42, emoji: "🍫" },
  { id: 8, name: "Croissant", category: "Postres", type: "Postres", description: "Hojaldre doradito, ideal para el café.", price: 38, emoji: "🥐" }
];

const productGrid = document.getElementById("productGrid");
const cartOverlay = document.getElementById("cartOverlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const toast = document.getElementById("toast");
const ticketOverlay = document.getElementById("ticketOverlay");
const ticketContent = document.getElementById("ticketContent");
let cart = [];
let toastTimer;
let currentTicket = null;
const ORDERS_KEY = "cafeteriaLosTresIngOrders";

const money = amount => amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const STOCK_KEY = "cafeteriaLosTresIngStockV2";
const INITIAL_STOCK = Object.fromEntries(products.map(product => [product.id, 50]));

function getStock() {
  try {
    const saved = JSON.parse(localStorage.getItem(STOCK_KEY) || "null");
    return saved && typeof saved === "object" ? { ...INITIAL_STOCK, ...saved } : { ...INITIAL_STOCK };
  } catch {
    return { ...INITIAL_STOCK };
  }
}
let stock = getStock();

function saveStock() {
  localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("cafeteriaLosTresIngSession") || "null");
  } catch {
    return null;
  }
}

function renderAccountLink() {
  const link = document.getElementById("accountLink");
  const session = getSession();
  if (!link) return;
  if (session) {
    link.textContent = `Hola, ${session.fullName.split(" ")[0]} · Cerrar sesión`;
    link.href = "#";
    link.addEventListener("click", event => {
      event.preventDefault();
      localStorage.removeItem("cafeteriaLosTresIngSession");
      showToast("Sesión cerrada.");
      setTimeout(() => window.location.href = "index.html", 500);
    });
  }
}

function renderProducts(filter = "Todos") {
  const filtered = filter === "Todos" ? products : products.filter(p => p.type === filter);
  productGrid.innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-art" aria-hidden="true">${p.emoji}</div>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="stock-status ${stock[p.id] > 0 ? "in-stock" : "out-stock"}">
          ${stock[p.id] > 0 ? `Disponible: ${stock[p.id]} piezas` : "AGOTADO"}
        </div>
        <div class="product-bottom">
          <span class="price">${money(p.price)}</span>
          <button class="add-button" data-add="${p.id}" aria-label="Agregar ${p.name} al carrito" ${stock[p.id] <= 0 ? "disabled" : ""}>+</button>
        </div>
      </div>
    </article>
  `).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);
  const quantityInCart = existing ? existing.quantity : 0;
  if (!product || stock[id] <= quantityInCart) {
    showToast(stock[id] <= 0 ? "Este producto está agotado." : "Ya agregaste todas las piezas disponibles.");
    return;
  }
  if (existing) existing.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  renderCart();
  showToast("¡Agregado a tu carrito!");
}

function changeQuantity(id, amount) {
  const item = cart.find(p => p.id === id);
  if (!item) return;
  if (amount > 0 && item.quantity >= stock[id]) {
    showToast("No hay más piezas disponibles de este producto.");
    return;
  }
  item.quantity += amount;
  cart = cart.filter(p => p.quantity > 0);
  renderCart();
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = count;
  cartTotal.textContent = money(total);
  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-cart">Todavía no agregas productos.</p>';
    return;
  }
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div><strong>${item.emoji} ${item.name}</strong><small>${money(item.price)} cada uno</small>
        <div class="quantity-controls">
          <button data-minus="${item.id}" aria-label="Quitar uno de ${item.name}">−</button>
          <span>${item.quantity}</span>
          <button data-plus="${item.id}" aria-label="Agregar uno de ${item.name}">+</button>
        </div>
      </div>
      <strong>${money(item.price * item.quantity)}</strong>
    </div>
  `).join("");
}

function openCart() {
  cartOverlay.classList.add("open");
  cartOverlay.setAttribute("aria-hidden", "false");
}
function closeCart() {
  cartOverlay.classList.remove("open");
  cartOverlay.setAttribute("aria-hidden", "true");
}

function createTicket() {
  const session = getSession();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const now = new Date();
  const ticketNumber = `CLTI-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Date.now()).slice(-5)}`;
  currentTicket = {
    id: ticketNumber,
    status: "Pendiente",
    ticketNumber,
    date: now.toLocaleString("es-MX"),
    customer: session.fullName,
    email: session.email,
    items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price, subtotal: item.price * item.quantity })),
    total
  };
  cart.forEach(item => { stock[item.id] -= item.quantity; });
  saveStock();
  renderProducts(document.querySelector(".filter.active")?.dataset.filter === "Todo" ? "Todos" : (document.querySelector(".filter.active")?.dataset.filter || "Todos"));
  const savedOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  savedOrders.unshift(currentTicket);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(savedOrders));

  const cancelButton = document.getElementById("cancelOrder");
  cancelButton.disabled = false;
  cancelButton.textContent = "Cancelar pedido";
  ticketContent.innerHTML = `
    <div class="ticket-brand">
      <div class="ticket-coffee">☕</div>
      <h2 id="ticketTitle">CAFETERIA LOS TRES ING</h2>
      <p>Comprobante de pedido</p>
    </div>
    <div class="ticket-meta">
      <p><strong>Ticket:</strong> ${currentTicket.ticketNumber}</p>
      <p><strong>Fecha:</strong> ${currentTicket.date}</p>
      <p><strong>Cliente:</strong> ${escapeHTML(currentTicket.customer)}</p>
      <p><strong>Correo:</strong> ${escapeHTML(currentTicket.email)}</p>
    </div>
    <div class="ticket-lines">
      <div class="ticket-line ticket-line-head"><span>Producto</span><span>Cant.</span><span>Importe</span></div>
      ${currentTicket.items.map(item => `
        <div class="ticket-line">
          <span>${escapeHTML(item.name)}<small>${money(item.price)} c/u</small></span>
          <span>${item.quantity}</span>
          <strong>${money(item.subtotal)}</strong>
        </div>`).join("")}
    </div>
    <div class="ticket-total"><span>TOTAL</span><strong>${money(currentTicket.total)}</strong></div>
    <p class="ticket-thanks">¡Gracias por tu compra!</p>
    <p class="ticket-disclaimer">Comprobante de demostración escolar. No representa un pago real.</p>
  `;
  ticketOverlay.classList.add("open");
  ticketOverlay.setAttribute("aria-hidden", "false");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function closeTicket() {
  ticketOverlay.classList.remove("open");
  ticketOverlay.setAttribute("aria-hidden", "true");
}

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    renderProducts(button.dataset.filter === "Todo" ? "Todos" : button.dataset.filter);
  });
});
cartItems.addEventListener("click", event => {
  const plus = event.target.closest("[data-plus]");
  const minus = event.target.closest("[data-minus]");
  if (plus) changeQuantity(Number(plus.dataset.plus), 1);
  if (minus) changeQuantity(Number(minus.dataset.minus), -1);
});
document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", event => { if (event.target === cartOverlay) closeCart(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
    closeTicket();
  }
});
function resolveUnavailableItems() {
  for (const item of [...cart]) {
    const available = stock[item.id] || 0;
    if (available >= item.quantity) continue;

    const shortage = item.quantity - available;
    const wantsReplacement = window.confirm(
      `No hay suficientes piezas de ${item.name}.\n\n` +
      `Solicitaste ${item.quantity} y solo quedan ${available}.\n` +
      `¿Deseas cambiar este producto por otro?\n\n` +
      `Aceptar = elegir otro producto.\nCancelar = cancelar todo el pedido.`
    );
    if (!wantsReplacement) {
      cart = [];
      renderCart();
      showToast("Pedido cancelado. No se realizó ningún cobro.");
      return false;
    }

    const alternatives = products.filter(product =>
      product.id !== item.id && (stock[product.id] || 0) >= item.quantity
    );
    if (!alternatives.length) {
      window.alert("No hay otro producto con existencias suficientes para reemplazarlo. Se canceló el pedido.");
      cart = [];
      renderCart();
      return false;
    }

    const choices = alternatives.map((product, index) =>
      `${index + 1}. ${product.name} — ${money(product.price)} (existencias: ${stock[product.id]})`
    ).join("\n");
    const answer = window.prompt(
      `Elige el producto de reemplazo para ${item.name} (${item.quantity} pieza(s)):\n\n${choices}\n\nEscribe el número de tu elección:`
    );
    const selected = Number(answer);
    if (!Number.isInteger(selected) || selected < 1 || selected > alternatives.length) {
      window.alert("No seleccionaste una opción válida. Se canceló el pedido.");
      cart = [];
      renderCart();
      return false;
    }

    const replacementProduct = alternatives[selected - 1];
    const index = cart.findIndex(cartItem => cartItem.id === item.id);
    cart.splice(index, 1, { ...replacementProduct, quantity: item.quantity });
    showToast(`${item.name} se cambió por ${replacementProduct.name}.`);
  }
  renderCart();
  return true;
}

document.getElementById("checkout").addEventListener("click", () => {
  if (!cart.length) {
    showToast("Agrega al menos un producto primero.");
    return;
  }
  if (!getSession()) {
    localStorage.setItem("cafeteriaLosTresIngPendingCart", JSON.stringify(cart));
    window.location.href = "index.html";
    return;
  }
  if (!resolveUnavailableItems()) return;
  createTicket();
  cart = [];
  renderCart();
  closeCart();
});
document.getElementById("closeTicket").addEventListener("click", closeTicket);
document.getElementById("finishTicket").addEventListener("click", closeTicket);
document.getElementById("cancelOrder").addEventListener("click", () => {
  if (!currentTicket) return;
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  const order = orders.find(item => item.id === currentTicket.id);
  if (!order || order.status === "Cancelado") return;
  if (!window.confirm("¿Seguro que deseas cancelar este pedido?")) return;
  order.status = "Cancelado";
  order.cancelledAt = new Date().toLocaleString("es-MX");
  if (!order.stockReturned) {
    (order.items || []).forEach(item => {
      if (item.id != null) stock[item.id] = (stock[item.id] || 0) + Number(item.quantity || 0);
    });
    order.stockReturned = true;
    saveStock();
    renderProducts();
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  document.getElementById("cancelOrder").disabled = true;
  document.getElementById("cancelOrder").textContent = "Pedido cancelado";
  showToast("El pedido se marcó como cancelado.");
});
document.getElementById("printTicket").addEventListener("click", () => window.print());
ticketOverlay.addEventListener("click", event => { if (event.target === ticketOverlay) closeTicket(); });

document.getElementById("menuToggle").addEventListener("click", () => {
  document.getElementById("nav").classList.toggle("open");
});
document.querySelectorAll("#nav a").forEach(link => link.addEventListener("click", () => {
  document.getElementById("nav").classList.remove("open");
}));
document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
renderAccountLink();
