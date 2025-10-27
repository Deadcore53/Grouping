const products = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 999,
      image: "https://via.placeholder.com/300x200?text=Headphones"
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 1299,
      image: "https://via.placeholder.com/300x200?text=Smart+Watch"
    },
    {
      id: 3,
      name: "Gaming Mouse",
      price: 799,
      image: "https://via.placeholder.com/300x200?text=Gaming+Mouse"
    },
    {
      id: 4,
      name: "Mechanical Keyboard",
      price: 1499,
      image: "https://via.placeholder.com/300x200?text=Keyboard"
    }
  ];
  
  const cart = [];
  
  document.addEventListener("DOMContentLoaded", () => {
    const productList = document.getElementById("productList");
    const cartList = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");
    const cartPanel = document.getElementById("cart");
    const cartToggle = document.getElementById("cartToggle");
  
    // Render products
    products.forEach(p => {
      const card = document.createElement("div");
      card.classList.add("product-card");
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>₱${p.price}</p>
        <button>Add to Cart</button>
      `;
      card.querySelector("button").addEventListener("click", () => addToCart(p));
      productList.appendChild(card);
    });
  
    // Cart toggle
    cartToggle.addEventListener("click", () => {
      cartPanel.classList.toggle("open");
    });
  
    // Add product to cart
    function addToCart(product) {
      const existing = cart.find(item => item.id === product.id);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ ...product, qty: 1 });
      }
      updateCart();
    }
  
    // Update cart UI
    function updateCart() {
      cartList.innerHTML = "";
      let total = 0;
      let count = 0;
  
      cart.forEach(item => {
        total += item.price * item.qty;
        count += item.qty;
  
        const li = document.createElement("li");
        li.innerHTML = `
          ${item.name} x${item.qty}
          <span>₱${item.price * item.qty}</span>
        `;
        cartList.appendChild(li);
      });
  
      cartTotal.textContent = total.toFixed(2);
      cartCount.textContent = count;
    }
  
    // Checkout
    document.getElementById("checkoutBtn").addEventListener("click", () => {
      if (cart.length === 0) return alert("Your cart is empty!");
      alert("Thank you for your purchase! 🛒");
      cart.length = 0;
      updateCart();
      cartPanel.classList.remove("open");
    });
  });
  