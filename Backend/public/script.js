let products = [];
let cart = JSON.parse(localStorage.getItem("novashop-cart") || "[]");
let currentSort = "default";

const $ = (id) => document.getElementById(id);
const money = (n) => Number(n || 0).toLocaleString("vi-VN") + "₫";

async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("API error");
    products = await res.json();
    renderProducts();
  } catch (err) {
    $("status").textContent = "Không tải được sản phẩm. Hãy kiểm tra server Node.js.";
  }
}

function renderProducts() {
  const query = $("searchInput").value.trim().toLowerCase();
  let list = products.filter(p => String(p.name).toLowerCase().includes(query));

  if (currentSort === "low") list.sort((a,b) => a.price - b.price);
  if (currentSort === "high") list.sort((a,b) => b.price - a.price);

  $("status").textContent = list.length ? `${list.length} sản phẩm` : "Không tìm thấy sản phẩm phù hợp.";
  $("productList").innerHTML = list.map(p => `
    <article class="card">
      <img class="product-image" src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}"
           onerror="this.src='https://via.placeholder.com/600x500?text=NovaShop'">
      <div class="card-body">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">${money(p.price)}</div>
        <button class="add" onclick="addToCart(${Number(p.id)})">+ Thêm vào giỏ</button>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const product = products.find(p => Number(p.id) === Number(id));
  if (!product) return;
  const found = cart.find(i => Number(i.id) === Number(id));
  if (found) found.qty += 1;
  else cart.push({ id: product.id, name: product.name, price: Number(product.price), image: product.image, qty: 1 });
  saveCart();
  showToast("Đã thêm sản phẩm vào giỏ");
  openCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => Number(i.id) === Number(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => Number(i.id) !== Number(id));
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => Number(i.id) !== Number(id));
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem("novashop-cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  const count = cart.reduce((s,i) => s + i.qty, 0);
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  $("cartCount").textContent = count;
  $("totalPrice").textContent = money(total);

  $("cartItems").innerHTML = cart.length ? cart.map(i => `
    <div class="cart-row">
      <div>
        <strong>${escapeHtml(i.name)}</strong>
        <span>${money(i.price)}</span>
        <div class="qty">
          <button onclick="changeQty(${i.id},-1)">−</button>
          <b>${i.qty}</b>
          <button onclick="changeQty(${i.id},1)">+</button>
          <button class="remove" onclick="removeItem(${i.id})">Xóa</button>
        </div>
      </div>
      <strong>${money(i.price * i.qty)}</strong>
    </div>
  `).join("") : `<div class="status">🛒 Giỏ hàng đang trống.</div>`;
}

function openCart() {
  $("cartDrawer").classList.add("open");
  $("overlay").classList.add("show");
}
function closeCart() {
  $("cartDrawer").classList.remove("open");
  $("overlay").classList.remove("show");
}

$("openCart").onclick = openCart;
$("closeCart").onclick = closeCart;
$("overlay").onclick = closeCart;

$("heroShop").onclick = () => $("products").scrollIntoView();
$("scrollProducts").onclick = () => $("products").scrollIntoView();

$("searchForm").addEventListener("submit", e => {
  e.preventDefault();
  renderProducts();
  $("products").scrollIntoView({behavior:"smooth"});
});
$("searchInput").addEventListener("input", renderProducts);

document.querySelectorAll(".filter").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    renderProducts();
  };
});

$("checkoutButton").onclick = () => {
  if (!cart.length) return showToast("Giỏ hàng đang trống");
  $("checkoutModal").classList.add("show");
};
$("closeModal").onclick = () => $("checkoutModal").classList.remove("show");

$("checkoutForm").addEventListener("submit", async e => {
  e.preventDefault();
  const data = new FormData(e.target);
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        cart: cart.map(i => ({name:i.name, price:i.price, qty:i.qty})),
        total,
        customer: {
          name: data.get("name"),
          phone: data.get("phone"),
          address: data.get("address")
        }
      })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Order failed");
    cart = [];
    saveCart();
    $("checkoutModal").classList.remove("show");
    closeCart();
    e.target.reset();
    showToast(result.message || "Đặt hàng thành công!");
  } catch (err) {
    showToast("Không gửi được đơn hàng: " + err.message);
  }
});

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(value) { return escapeHtml(value); }

renderCart();
fetchProducts();
