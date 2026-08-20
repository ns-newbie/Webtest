
    let cart = [];

    async function fetchProducts() {
      const res = await fetch('/api/products');
      const products = await res.json();
      const list = document.getElementById('productList');
      list.innerHTML = products.map(p => `
        <div class="card">
          <img src="${p.image}" width="100">
          <h4>${p.name}</h4>
          <p>${p.price.toLocaleString()} VNĐ</p>
          <button onclick="addToCart('${p.name}', ${p.price})">Thêm vào giỏ</button>
        </div>
      `).join('');
    }

    function addToCart(name, price) {
      cart.push({ name, price });
      renderCart();
    }

    function renderCart() {
      const cartItems = document.getElementById('cartItems');
      const totalPrice = document.getElementById('totalPrice');
      cartItems.innerHTML = cart.map(item => `<li>${item.name} - ${item.price.toLocaleString()} VNĐ</li>`).join('');
      
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      totalPrice.innerText = total.toLocaleString();
    }

    async function checkout() {
      if (cart.length === 0) return alert("Giỏ hàng đang trống!");
      
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, total })
      });
      
      const result = await res.json();
      alert(result.message);
      cart = [];
      renderCart();
    }

    fetchProducts();
