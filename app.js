// Simple description generator from name/category/filename
function makeDesc(name, cat, imgUrl) {
  const base = name.replace(/\s+/g, ' ').trim();
  const hints = [];
  const f = (imgUrl.split('/').pop() || '').toLowerCase();
  if (/(erkak|men)/.test(f)) hints.push("erkaklar uchun");
  if (/(ayol|girl|women|ayollar)/.test(f)) hints.push("ayollar uchun");
  if (/(bola|kid|yosh|bolalar)/.test(f)) hints.push("bolalar uchun");
  if (/(qora|black)/.test(f)) hints.push("qora rang");
  if (/(oq|white)/.test(f)) hints.push("oq rang");
  if (/(ko[‘'`]?k|blue)/.test(f)) hints.push("ko'k rang");
  if (/(yashil|green)/.test(f)) hints.push("yashil rang");
  if (/(sport)/.test(f)) hints.push("sport uchun");
  const tail = hints.length ? ` — ${hints.join(', ')}` : '';
  return `${base} — yuqori sifatli ${cat} kolleksiyasi${tail}.`;
}
// Creator branding constants used across UI
const CREATOR_FULL = "Abdulhay Avazxanov";
const CREATOR_SHORT = ""; // no product branding in titles
const CREATOR_PATRONYMIC = "Abdullayevich";

// State
const state = {
  products: [],
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]")),
  cart: new Map(JSON.parse(localStorage.getItem("cart") || "[]")), // id -> {product, qty, size, color}
  compare: new Set(JSON.parse(localStorage.getItem("compare") || "[]")),
  recentlyViewed: JSON.parse(localStorage.getItem("recentlyViewed") || "[]"),
  reviews: new Map(JSON.parse(localStorage.getItem("reviews") || "[]")), // productId -> [{name, rating, text, date}]
  orders: JSON.parse(localStorage.getItem("orders") || "[]"),
  newsletter: JSON.parse(localStorage.getItem("newsletter") || "[]"),
  filters: { q: "", category: "all", sort: "default", priceMax: 500000, view: "grid" },
  promo: null,
  shipping: { method: "standard" },
  page: { size: parseInt(localStorage.getItem('productsPerPage')) || 12, shown: parseInt(localStorage.getItem('productsPerPage')) || 12 },
  galleryRendered: false,
  currentProduct: null,
  selectedVariants: {} // {productId: {size: 'M', color: 'Qizil'}}
};

// Utilities
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const formatPrice = v => `${v.toLocaleString("uz-UZ")} so'm`;
const toast = (msg) => {
  // Check if notifications are enabled
  const notificationsEnabled = localStorage.getItem('notifications') !== 'false';
  if (!notificationsEnabled) return;
  
  const el = document.querySelector('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('toast--show');
  setTimeout(() => el.classList.remove('toast--show'), 1600);
};

// Build curated products per category (no duplicates, proper images)
function buildProducts() {
  const byCat = {
    svitra: {
      names: ["Premium Svitra Classic","Cozy Knit","Nordic Warm","Urban Minimal","Cable Knit","Soft Merino"],
      imgs: [
        "assets/Oq va Qora futbolkalar.jpg",
        "assets/Qora futbolkalar.jpg",
        "assets/blue-t-shirt.jpg",
        "assets/Ayollar uchun zamonaviy kiyim.avif",
        "assets/Ayollar uchun kiyimlar.jpg",
        "assets/wear for young girls.jpg",
        "assets/Wear1.jpg",
        "assets/Uzbek milliy cloth.jpg",
        "assets/Milly cloth for girls.jpg",
        "assets/Zamonaviy sport uchun.jpg"
      ],
      price: 99000
    },
    kastyum: {
      names: ["Formal Kastyum Slim","Royal Blue Suit","Signature Suit","Three-Piece Classic","Charcoal Suit","Beige Linen Suit"],
      imgs: [
        "assets/Suit for men.jpg",
        "assets/To'y uchun Kastyum shim.webp",
        "assets/Royality Kastyum.webp",
        "assets/Polat Qora katyumidan kopiya.jpg",
        "assets/Polatning kastyumlaridan kopiya.webp",
        "assets/Ayollar uchun kastyum.jpg"
      ],
      price: 99000
    },
    shim: {
      names: ["Chino Sand","Denim Dark","Formal Trousers","Jogger Urban","Cargo Olive","Slim Fit Black"],
      imgs: [
        "assets/Shalvar.jpg",
        "assets/Shalvarsimon shim.jpg",
        "assets/Shalvarsimon shimlar.avif",
        "assets/Yigitlar uchun shimlar.jpg",
        "assets/shimlar.jpg",
        "assets/Momiq kurtkalar ayollar uchun.webp"
      ],
      price: 129000
    },
    tufli: {
      names: ["Leather Oxfords","Derby Premium","Monk Strap","Patent Leather","Wingtip Brogues","Cap Toe"],
      imgs: [
        "assets/Oltin rangli tuflilar.png",
        "assets/Sport uchun oyoq kiyimlar.jpg",
        "assets/Ayollar uchun oyoq kiyimlar.jpg",
        "assets/Sport uchun naskilar.jpg",
        "assets/Sport uchun naski.jpg",
        "assets/Pinetkalar.jpg"
      ],
      price: 199000
    },
    krosovka: {
      names: ["Runner Lite","Street Sneakers","Retro Court","Pro Runner","Trail Grip","Air Flex"],
      imgs: [
        "assets/Ayol va Erkaklar uchun krosovkalar.avif",
        "assets/Bolalar uchun krosovkalar.avif",
        "assets/Nike krosovkalari.jpg",
        "assets/Qaymoq rangli krosovkalar.jpg",
        "assets/Qora nike krosovkalar.jpg",
        "assets/Yashil rangdagi krosovkalar.jpg",
        "assets/Sport uchun krosovkalar.jpg",
        "assets/Zamonaviy sport uchun.jpg"
      ],
      price: 159000
    },
    "bosh-kiyim": {
      names: ["Wool Fedora","Classic Cap","Beanie Knit","Panama Summer","Bucket Hat","Flat Cap"],
      imgs: [
        "assets/Shapka.jpg",
        "assets/Shlyapa.webp",
        "assets/oq kepka.jpg",
        "assets/Ayollar uchun shlyapa.jpg"
      ],
      price: 79000
    }
  };
  const out = [];
  let uid = 1;
  const used = new Set();
  Object.entries(byCat).forEach(([cat, cfg]) => {
    const imgs = Array.from(new Set(cfg.imgs));
    const count = Math.max(cfg.names.length, imgs.length);
    for (let i = 0; i < count; i++) {
      const fallbackName = (path => {
        const base = path.split('/').pop() || '';
        return base.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
      })(imgs[i] || imgs[0] || `${cat}-${i+1}`);
      const name = cfg.names[i] || fallbackName || `${cat} ${i+1}`;
      let imgUrl = imgs[i] || imgs[i % imgs.length] || imgs[0];
      if (used.has(imgUrl)) {
        // find next unused image in this category
        let found = false;
        for (let k = 0; k < imgs.length; k++) {
          const candidate = imgs[(i + k) % imgs.length];
          if (!used.has(candidate)) { imgUrl = candidate; found = true; break; }
        }
        if (!found) {
          // final fallback unique per product
          const sig = (uid * 131) % 10000;
          imgUrl = `https://source.unsplash.com/600x600/?clothes,fashion&sig=${sig}`;
        }
      }
      used.add(imgUrl);
      out.push({
        id: `${cat}-${uid++}`,
        name,
        category: cat,
        price: cfg.price + i * 5000,
        img: imgUrl,
        desc: makeDesc(name, cat, imgUrl),
        sizes: ["S", "M", "L", "XL"],
        colors: ["Qora", "Oq", "Ko'k", "Qizil"],
        inStock: Math.random() > 0.2,
        stockCount: Math.floor(Math.random() * 50) + 10,
        tags: [cat, i % 2 === 0 ? "Yangi" : "Mashhur", i % 3 === 0 ? "Chegirma" : ""].filter(Boolean),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  });
  return out;
}

// Ensure add-to-cart works via grid-level delegation
function attachProductGridDelegation() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('.add-cart');
    if (btn) {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      if (id) addToCart(id);
    }
  });
}

// Theme management - simplified and made more reliable
function applyTheme(mode) {
  const root = document.documentElement;
  
  // Always set the theme attribute directly
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('theme', mode);
  
  // Update theme toggles in the settings modal if it exists
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(option => {
    if (option.dataset.theme === mode) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

function initTheme() {
  // Theme is now managed by settings.js, but we keep this for backward compatibility
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
}

// Theme toggle is now only available through settings
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  
  // Use the settings module if available
  if (window.Settings && typeof window.Settings.setTheme === 'function') {
    window.Settings.setTheme(next);
  } else {
    // Fallback to direct theme application if settings module is not available
    applyTheme(next);
  }
}

const PRODUCT_DATA = buildProducts();

state.products = [...PRODUCT_DATA];

// Routing between views
function setView(view) {
  $$(".view").forEach(v => v.classList.remove("view--active"));
  const target = $(`.view[data-view="${view}"]`);
  if (target) target.classList.add("view--active");
  
  // Handle view-specific rendering
  if (view === 'home' && !state.galleryRendered) {
    renderGallery();
    // Mahsulotlar faqat Mahsulotlar bo'limida ko'rsatiladi
  } else if (view === 'catalog') {
    // Reset pagination when entering catalog
    state.page.shown = state.page.size;
    renderProducts();
  } else if (view === 'favorites') {
    renderFavorites();
  } else if (view === 'cart') {
    renderCart();
  } else if (view === 'compare') {
    renderCompare();
  } else if (view === 'orders') {
    renderOrders();
  }
}

// Render products
function renderProducts() {
  const grid = $("#product-grid");
  if (!grid) return;
  grid.innerHTML = "";
  
  // Ensure products are loaded
  if (!state.products || state.products.length === 0) {
    state.products = [...PRODUCT_DATA];
  }
  
  let items = state.products.filter(p =>
    (state.filters.category === "all" || p.category === state.filters.category) &&
    (state.filters.q === "" || p.name.toLowerCase().includes(state.filters.q.toLowerCase())) &&
    p.price <= (state.filters.priceMax || 500000)
  );
  
  switch (state.filters.sort) {
    case "price-asc": items.sort((a,b)=>a.price-b.price); break;
    case "price-desc": items.sort((a,b)=>b.price-a.price); break;
    case "name-asc": items.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "name-desc": items.sort((a,b)=>b.name.localeCompare(a.name)); break;
    case "rating-desc": items.sort((a,b)=>getProductRating(b.id)-getProductRating(a.id)); break;
    case "newest": items.sort((a,b)=>new Date(b.createdAt || 0)-new Date(a.createdAt || 0)); break;
  }
  
  // Update products count
  const countEl = document.getElementById('products-count');
  if (countEl) countEl.textContent = items.length;
  
  // Apply view mode
  const viewMode = state.filters.view || 'grid';
  if (viewMode === 'list') {
    grid.classList.add('grid--list');
  } else {
    grid.classList.remove('grid--list');
  }
  
  const limit = state.page.shown;
  const visible = items.slice(0, limit);
  const frag = document.createDocumentFragment();
  visible.forEach((p, idx) => frag.appendChild(productCard(p, idx)));
  grid.appendChild(frag);
  
  const loadMore = document.getElementById('load-more');
  if (loadMore) {
    const hasMore = items.length > limit;
    loadMore.style.display = hasMore ? '' : 'none';
    loadMore.onclick = () => { 
      state.page.shown += state.page.size; 
      renderProducts(); 
    };
  }
  
  // Show message if no products found
  if (items.length === 0) {
    grid.innerHTML = '<div class="card" style="padding:40px; text-align:center; color:var(--muted);">Mahsulotlar topilmadi. Filtrlarni o\'zgartiring.</div>';
    if (countEl) countEl.textContent = '0';
  }
}

function productCard(product, idx=0) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.setProperty('--i', String(idx));
  const rating = getProductRating(product.id);
  const reviewCount = getReviewCount(product.id);
  const isInCompare = state.compare.has(product.id);
  const isNew = new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  card.innerHTML = `
    <div class="card__media">
      <img loading=\"lazy\" decoding=\"async\" sizes=\"(max-width: 600px) 50vw, 25vw\" src=\"${product.img}\" alt=\"${product.name}\">
      <button class="card__fav" aria-label="Sevimlilarga qo'shish" data-id="${product.id}">❤</button>
      ${isNew ? '<span class="card__badge card__badge--new">Yangi</span>' : ''}
    </div>
    <div class="card__body">
      <div class="card__title">${product.name}</div>
      <div class="card__meta">
        <span class="muted">${product.category}</span>
        <span class="price">${formatPrice(product.price)}</span>
      </div>
      <div class="card__rating">
        <span class="stars">${renderStars(rating)}</span>
        <span class="rating-count">(${reviewCount})</span>
      </div>
      ${product.tags && product.tags.length > 0 ? `<div class="card__tags">${product.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
      <div class="card__actions">
        <button type="button" class="btn btn--primary add-cart" data-id="${product.id}" ${!product.inStock ? 'disabled' : ''}>Savatga solish</button>
        <button type="button" class="btn add-fav" data-id="${product.id}">Sevimli</button>
        <button type="button" class="btn quick-view" data-id="${product.id}">Tezkor ko'rish</button>
      </div>
    </div>`;

  const favBtn = card.querySelector(".card__fav");
  const addFavBtn = card.querySelector(".add-fav");
  const addCartBtn = card.querySelector(".add-cart");
  const quickViewBtn = card.querySelector(".quick-view");
  const imgEl = card.querySelector("img");
  attachImgFallback(imgEl);
  card.querySelector('.card__media').addEventListener('click', () => { addToRecentlyViewed(product.id); openProductModal(product); });
  
  const updateFavUI = () => {
    const isFav = state.favorites.has(product.id);
    favBtn.textContent = isFav ? "💜" : "❤";
  };
  
  // Check if product is in cart
  const isInCart = Array.from(state.cart.values()).some(item => item.product.id === product.id);
  
  if (isInCart) {
    // Change button to "Savatdan olish"
    addCartBtn.textContent = "Savatdan olish";
    addCartBtn.classList.remove('btn--primary');
    addCartBtn.classList.add('btn--danger');
    addCartBtn.addEventListener("click", (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); 
      // Find and remove from cart
      for (const [key, value] of state.cart.entries()) {
        if (value.product.id === product.id) {
          removeFromCart(key);
          break;
        }
      }
    });
  } else {
    addCartBtn.addEventListener("click", (e) => { 
      e.preventDefault(); 
      e.stopPropagation(); 
      addToCart(product.id); 
    });
  }
  
  favBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id, true); });
  addFavBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id, true); });
  if (quickViewBtn) {
    quickViewBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); addToRecentlyViewed(product.id); openProductModal(product); });
  }
  updateFavUI();
  return card;
}

// Favorites
function toggleFavorite(id, withToast=false) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    withToast && toast("Sevimlilardan olib tashlandi");
  } else {
    state.favorites.add(id);
    withToast && toast("Sevimlilarga qo'shildi");
  }
  localStorage.setItem("favorites", JSON.stringify(Array.from(state.favorites)));
  renderProducts();
  renderFavorites();
}

function renderFavorites() {
  const grid = $("#favorites-grid");
  grid.innerHTML = "";
  const products = state.products.filter(p => state.favorites.has(p.id));
  if (!products.length) {
    grid.innerHTML = `<div class="card" style="padding:16px;">Sevimlilar bo'sh. Katalogdan mahsulot qo'shing.</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  products.forEach((p, idx) => frag.appendChild(productCard(p, idx)));
  grid.appendChild(frag);
}

// Cart
function addToCart(id, size = null, color = null) {
  try { console.debug('[cart] addToCart clicked', id); } catch(_) {}
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  
  // Get selected variants or use defaults
  const variant = state.selectedVariants[id] || { size: size || product.sizes?.[0] || 'M', color: color || product.colors?.[0] || 'Qora' };
  
  // Create unique cart key with variants
  const cartKey = `${id}_${variant.size}_${variant.color}`;
  
  // Check if exact variant already exists
  let found = false;
  for (const [key, value] of state.cart.entries()) {
    if (value.product.id === id && value.size === variant.size && value.color === variant.color) {
      value.qty += 1;
      state.cart.set(key, value);
      found = true;
      break;
    }
  }
  
  if (!found) {
    state.cart.set(cartKey, { 
      product, 
      qty: 1, 
      size: variant.size, 
      color: variant.color 
    });
  }
  
  persistCart();
  renderCart();
  updateCartCount();
  // Re-render products to update "Savatdan olish" button
  if (document.querySelector('.view--active[data-view="catalog"]')) {
    renderProducts();
  }
  if (document.querySelector('.view--active[data-view="favorites"]')) {
    renderFavorites();
  }
  toast(`Savatga qo'shildi (${variant.size}, ${variant.color})`);
}

function changeQty(cartKey, delta) {
  const row = state.cart.get(cartKey);
  if (!row) return;
  const next = Math.max(1, row.qty + delta);
  if (next === 0) {
    removeFromCart(cartKey);
    return;
  }
  row.qty = next;
  state.cart.set(cartKey, row);
  persistCart();
  renderCart();
  updateCartCount();
}

function removeFromCart(cartKey) {
  state.cart.delete(cartKey);
  persistCart();
  renderCart();
  updateCartCount();
  // Re-render products to update "Savatga solish" button
  if (document.querySelector('.view--active[data-view="catalog"]')) {
    renderProducts();
  }
  if (document.querySelector('.view--active[data-view="favorites"]')) {
    renderFavorites();
  }
  toast("Savatdan olib tashlandi");
}

function persistCart() {
  localStorage.setItem("cart", JSON.stringify(Array.from(state.cart.entries())));
}

// Export cart to PDF
function exportCartToPDF() {
  if (state.cart.size === 0) {
    toast("Savat bo'sh");
    return;
  }
  
  let content = `
    <h1>Savat ro'yxati</h1>
    <p>Sana: ${new Date().toLocaleString('uz-UZ')}</p>
    <table border="1" cellpadding="5" style="width:100%; border-collapse:collapse;">
      <tr>
        <th>Mahsulot</th>
        <th>O'lcham</th>
        <th>Rang</th>
        <th>Miqdor</th>
        <th>Narx</th>
        <th>Jami</th>
      </tr>
  `;
  
  state.cart.forEach(({ product, qty, size, color }) => {
    const total = product.price * qty;
    content += `
      <tr>
        <td>${product.name}</td>
        <td>${size || 'N/A'}</td>
        <td>${color || 'N/A'}</td>
        <td>${qty}</td>
        <td>${formatPrice(product.price)}</td>
        <td>${formatPrice(total)}</td>
      </tr>
    `;
  });
  
  const subtotal = cartTotal();
  const { shipping, discount } = computeShippingAndDiscount(subtotal);
  const total = Math.max(0, subtotal + shipping - discount);
  
  content += `
      <tr>
        <td colspan="5" style="text-align:right;"><strong>Jami:</strong></td>
        <td><strong>${formatPrice(total)}</strong></td>
      </tr>
    </table>
    <p style="margin-top:20px;">© ${new Date().getFullYear()} Abdulhay Boutique</p>
  `;
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Savat ro'yxati</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { margin: 20px 0; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
  toast("PDF tayyorlandi");
}

// Share cart
function shareCart() {
  if (state.cart.size === 0) {
    toast("Savat bo'sh");
    return;
  }
  
  const items = Array.from(state.cart.values()).map(({ product, qty }) => 
    `${product.name} (${qty} ta)`
  ).join(', ');
  
  const text = `Mening savatim: ${items}`;
  const url = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'Mening savatim',
      text: text,
      url: url
    }).catch(() => {
      copyToClipboard(text + '\n' + url);
    });
  } else {
    copyToClipboard(text + '\n' + url);
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast("Nusxalandi!");
  }).catch(() => {
    toast("Nusxalashda xatolik");
  });
}

// Clear cart
function clearCart() {
  if (state.cart.size === 0) {
    toast("Savat allaqachon bo'sh");
    return;
  }
  
  if (confirm("Haqiqatan ham savatni tozalashni xohlaysizmi?")) {
    state.cart.clear();
    persistCart();
    renderCart();
    updateCartCount();
    if (document.querySelector('.view--active[data-view="catalog"]')) {
      renderProducts();
    }
    toast("Savat tozalandi");
  }
}

function cartTotal() {
  let t = 0;
  state.cart.forEach(({ product, qty }) => t += product.price * qty);
  return t;
}

function computeShippingAndDiscount(subtotal) {
  // Shipping
  const method = state.shipping.method || 'standard';
  const shipping = method === 'express' ? 39000 : subtotal > 300000 ? 0 : 15000;
  const eta = method === 'express' ? '24 soat ichida' : '1–3 kun';
  // Promo
  let discount = 0;
  const code = (state.promo || '').toUpperCase();
  if (code === 'SALE10') discount = Math.floor(subtotal * 0.10);
  if (code === 'SALE20') discount = Math.floor(subtotal * 0.20);
  if (code === 'FREE') {
    // Free shipping
    discount += shipping; // effectively cancels shipping
  }
  return { shipping, eta, discount };
}

function updateCartSummaryUI() {
  const subtotal = cartTotal();
  const { shipping, eta, discount } = computeShippingAndDiscount(subtotal);
  const total = Math.max(0, subtotal + shipping - discount);
  const el = (id) => document.getElementById(id);
  if (el('cart-subtotal')) el('cart-subtotal').textContent = formatPrice(subtotal);
  if (el('cart-discount')) el('cart-discount').textContent = `- ${formatPrice(discount)}`;
  if (el('cart-shipping')) el('cart-shipping').textContent = formatPrice(Math.max(0, shipping - (state.promo && state.promo.toUpperCase()==='FREE' ? shipping : 0)));
  if (el('ship-eta')) el('ship-eta').textContent = eta ? `(${eta})` : '';
  if (el('cart-total')) el('cart-total').textContent = formatPrice(total);
}

function renderCart() {
  const list = $("#cart-list");
  if (!list) return;
  list.innerHTML = "";
  if (state.cart.size === 0) {
    list.innerHTML = `<div class="card" style="padding:16px; text-align:center;">Savat bo'sh. Katalogdan mahsulot qo'shing.</div>`;
  } else {
    state.cart.forEach(({ product, qty, size, color }, cartKey) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      const variantInfo = size || color ? `<div class="muted" style="font-size:12px; margin-top:4px;">O'lcham: ${size || 'N/A'}, Rang: ${color || 'N/A'}</div>` : '';
      row.innerHTML = `
        <img loading="lazy" decoding="async" src="${product.img}" alt="${product.name}">
        <div>
          <div style="font-weight:700;">${product.name}</div>
          <div class="muted">${formatPrice(product.price)}</div>
          ${variantInfo}
        </div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <div class="qty">
            <button aria-label="Kamaytirish">−</button>
            <span>${qty}</span>
            <button aria-label="Ko'paytirish">+</button>
          </div>
          <button class="btn" aria-label="O'chirish">O'chirish</button>
        </div>`;
      const img = row.querySelector('img');
      attachImgFallback(img);
      
      // Apply color filter to image if color is selected
      if (color) {
        updateProductImageColor(img, color);
      }
      
      const [decBtn, incBtn] = row.querySelectorAll(".qty button");
      const delBtn = row.querySelector(".btn");
      if (decBtn) decBtn.addEventListener("click", () => changeQty(cartKey, -1));
      if (incBtn) incBtn.addEventListener("click", () => changeQty(cartKey, +1));
      if (delBtn) delBtn.addEventListener("click", () => removeFromCart(cartKey));
      list.appendChild(row);
    });
  }
  const totalEl = $("#cart-total");
  if (totalEl) totalEl.textContent = formatPrice(cartTotal());
  updateCartSummaryUI();
}

function updateCartCount() {
  let count = 0;
  state.cart.forEach(({ qty }) => count += qty);
  $("#cart-count").textContent = String(count);
}

// Additionally render cart items as product cards grid (like favorites)
function renderCartProductsGrid(products) {
  const container = document.querySelector('.cart__items');
  if (!container) return;
  let grid = document.getElementById('cart-products-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.id = 'cart-products-grid';
    grid.className = 'grid';
    // insert after the cart list
    const listEl = document.getElementById('cart-list');
    if (listEl && listEl.parentNode === container) {
      container.insertBefore(grid, container.querySelector('.cart__summary'));
    } else {
      container.appendChild(grid);
    }
  }
  grid.innerHTML = '';
  if (!products || !products.length) {
    grid.style.display = 'none';
    return;
  }
  grid.style.display = '';
  const frag = document.createDocumentFragment();
  products.forEach((p, idx) => frag.appendChild(productCard(p, idx)));
  grid.appendChild(frag);
}

// Filters & search
function attachFilters() {
  $("#search-input").addEventListener("input", (e) => {
    state.filters.q = e.target.value.trim().toLowerCase();
    state.page.shown = state.page.size;
    renderProducts();
  });
  $("#category-filter").addEventListener("change", (e) => {
    state.filters.category = e.target.value;
    state.page.shown = state.page.size;
    renderProducts();
  });
  $("#sort-filter").addEventListener("change", (e) => {
    state.filters.sort = e.target.value;
    state.page.shown = state.page.size;
    renderProducts();
  });
  
  // View toggle (grid/list)
  const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filters.view = btn.dataset.view;
      localStorage.setItem('viewMode', state.filters.view);
      renderProducts();
    });
  });
  
  // Load saved view mode
  const savedView = localStorage.getItem('viewMode') || 'grid';
  state.filters.view = savedView;
  viewToggleBtns.forEach(btn => {
    if (btn.dataset.view === savedView) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Navigation
function attachNav() {
  const navLinks = document.querySelectorAll('.nav__link[data-view]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const view = link.getAttribute('data-view');
      if (view === 'settings') {
        // Settings toggle is handled by settings.js - don't prevent default
        return;
      }
      e.preventDefault();
      setView(view);
    });
  });
}

// Global delegation as a safety net for dynamic elements
document.addEventListener("click", (e) => {
  const addCart = e.target.closest && e.target.closest('.add-cart');
  if (addCart) {
    e.preventDefault();
    try { console.debug('[cart] document delegate add-cart'); } catch(_) {}
    const id = addCart.getAttribute('data-id');
    if (id) addToCart(id);
    return;
  }
  const addFav = e.target.closest && e.target.closest('.add-fav, .card__fav');
  if (addFav) {
    e.preventDefault();
    const id = addFav.getAttribute('data-id') || (addFav.closest('.card')?.querySelector('.add-cart')?.getAttribute('data-id'));
    if (id) toggleFavorite(id, true);
  }
  if (e.target.matches('[data-close-modal]')) {
    closeModal();
  }
});

// Checkout form
function attachCheckoutForm() {
  const form = $("#checkout-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.ism || !data.familya || !data.telefon || !data.manzil || !data.tolov || !data.hujjat) {
      toast("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }
    if (data.tolov === "karta" && (!data.karta || data.karta.replace(/\s/g, '').length < 16)) {
      toast("Karta raqamini to'liq kiriting");
      return;
    }
    if (state.cart.size === 0) {
      toast("Savat bo'sh");
      return;
    }
    // Fake submit with order id and status
    const orderId = `AB-${Date.now().toString().slice(-6)}`;
    const subtotal = cartTotal();
    const { shipping, eta, discount } = computeShippingAndDiscount(subtotal);
    const total = Math.max(0, subtotal + shipping - discount);
    const order = { 
      id: orderId, 
      status: 'Qabul qilindi', 
      total, 
      date: new Date().toISOString(),
      items: Array.from(state.cart.entries()).map(([id, {product, qty}]) => ({
        id, name: product.name, price: product.price, qty
      }))
    };
    state.orders.push(order);
    localStorage.setItem('orders', JSON.stringify(state.orders));
    localStorage.setItem('lastOrder', JSON.stringify(order));
    toast(`Rahmat, ${data.ism}! Buyurtma #${orderId} qabul qilindi.`);
    state.cart.clear();
    persistCart();
    renderCart();
    updateCartCount();
    form.reset();
  });
  const promoInput = document.getElementById('promo-input');
  const applyPromo = document.getElementById('apply-promo');
  if (applyPromo && promoInput) {
    applyPromo.addEventListener('click', () => {
      state.promo = promoInput.value.trim();
      updateCartSummaryUI();
      toast('Promokod qo\'llandi');
    });
  }
  const shipSel = document.getElementById('shipping-method');
  if (shipSel) {
    shipSel.addEventListener('change', () => {
      state.shipping.method = shipSel.value;
      updateCartSummaryUI();
    });
  }
}

// Init
function init() {
  // Ensure products are loaded first
  if (!state.products || state.products.length === 0) {
    state.products = [...PRODUCT_DATA];
  }
  
  // Set theme first before anything renders
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  
  // Set font size
  const savedFontSize = localStorage.getItem('fontSize') || 'medium';
  if (window.Settings && window.Settings.setFontSize) {
    window.Settings.setFontSize(savedFontSize);
  } else {
    document.documentElement.setAttribute('data-font-size', savedFontSize);
  }
  
  // Set animations
  const animationsEnabled = localStorage.getItem('animations') !== 'false';
  if (window.Settings && window.Settings.applyAnimations) {
    window.Settings.applyAnimations(animationsEnabled);
  } else {
    if (!animationsEnabled) {
      document.documentElement.setAttribute('data-no-animations', 'true');
    }
  }
  
  // Initialize settings
  if (window.Settings && typeof window.Settings.initSettings === 'function') {
    window.Settings.initSettings();
  }
  
  // Set current year in footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  
  document.title = `${CREATOR_FULL} | Kiyim Do'koni`;
  
  // Initialize core functionality
  attachNav();
  attachProductGridDelegation();
  attachCheckoutForm();
  attachPhotoUploader();
  attachFilters();
  attachPriceFilter();
  
  // Cart actions
  const exportPdfBtn = document.getElementById('export-cart-pdf');
  const shareCartBtn = document.getElementById('share-cart');
  const clearCartBtn = document.getElementById('clear-cart');
  
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportCartToPDF);
  }
  if (shareCartBtn) {
    shareCartBtn.addEventListener('click', shareCart);
  }
  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', clearCart);
  }
  
  // Initialize reviews from localStorage
  if (localStorage.getItem('reviews')) {
    const reviewsData = JSON.parse(localStorage.getItem('reviews'));
    state.reviews = new Map(reviewsData);
  }
  
  // Newsletter form
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletter-email').value;
      if (!state.newsletter.includes(email)) {
        state.newsletter.push(email);
        localStorage.setItem('newsletter', JSON.stringify(state.newsletter));
        toast("Obuna bo'ldingiz! Rahmat!");
        closeNewsletterModal();
      } else {
        toast("Bu email allaqachon ro'yxatdan o'tgan");
      }
    });
  }
  
  // Initialize newsletter modal
  initNewsletterModal();
  
  // Show newsletter modal after 5 seconds (first visit only)
  if (!localStorage.getItem('newsletterShown')) {
    setTimeout(() => {
      const modal = document.getElementById('newsletter-modal');
      if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        localStorage.setItem('newsletterShown', 'true');
      }
    }, 5000);
  }
  
  // Set initial view based on URL hash or default to home
  const hash = window.location.hash.replace('#', '');
  const validViews = ['home', 'catalog', 'favorites', 'author', 'cart', 'compare', 'orders', 'settings'];
  const initialView = validViews.includes(hash) ? hash : 'home';
  
  // Set the view and render appropriate content
  setView(initialView);
  
  // Update cart count and compare count
  updateCartCount();
  updateCompareCount();
  
  // Set author photo from available assets
  setAuthorPhotoFromAssets([
    'assets/oppa uzim.jpg',
    'assets/author.jpg',
    'assets/profile.jpg',
    'assets/abdulhay.jpg'
  ]);
  
  // Make functions globally available
  window.closeReviewModal = closeReviewModal;
  window.closeNewsletterModal = closeNewsletterModal;
  window.printOrder = printOrder;
}

document.addEventListener("DOMContentLoaded", init);

// Image fallback: replace broken URLs with reliable placeholder
function attachImgFallback(img) {
  if (!img) return;
  const seed = img.alt || 'apparel';
  // simple hash for variety
  let h = 0; for (let i = 0; i < seed.length; i++) h = ((h << 5) - h) + seed.charCodeAt(i) | 0;
  const sig = Math.abs(h) % 10000;
  const candidates = [
    `https://source.unsplash.com/600x600/?clothes,fashion&sig=${sig}`,
    'https://images.unsplash.com/photo-1520975893336-2a18f4b9a8f3?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop',
    `https://via.placeholder.com/600x600?text=${encodeURIComponent(seed)}`
  ];
  let tried = 0;
  const onErr = () => {
    if (tried >= candidates.length) {
      img.removeEventListener('error', onErr);
      return;
    }
    img.src = candidates[tried++];
  };
  img.addEventListener('error', onErr, { once: false });
}

// Photo uploader to let the user set their image without files on disk
function attachPhotoUploader() {
  const input = document.getElementById('photo-input');
  const btn = document.getElementById('upload-photo');
  if (!input || !btn) return;
  btn.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      localStorage.setItem('authorPhotoData', dataUrl);
      const authorPhoto = document.getElementById('author-photo');
      const brandPhoto = document.getElementById('brand-photo');
      if (authorPhoto) authorPhoto.src = dataUrl;
      if (brandPhoto) brandPhoto.src = dataUrl;
      toast('Rasm yuklandi');
    };
    reader.readAsDataURL(file);
  });
}

// Long gallery from products to make page longer and professional
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const imgs = state.products;

  const frag = document.createDocumentFragment();
  imgs.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'gallery__item';
    item.innerHTML = `<img loading="lazy" decoding="async" alt="${p.name}" src="${p.img}">`;
    const img = item.querySelector('img');
    attachImgFallback(img);
    frag.appendChild(item);
  });
  grid.appendChild(frag);
  state.galleryRendered = true;
}

// Product details modal
function openProductModal(product) {
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  state.currentProduct = product;
  const img = document.getElementById('modal-img');
  const title = document.getElementById('modal-title');
  const cat = document.getElementById('modal-category');
  const desc = document.getElementById('modal-desc');
  const price = document.getElementById('modal-price');
  const addCart = document.getElementById('modal-add-cart');
  const addFav = document.getElementById('modal-add-fav');
  const compareBtn = document.getElementById('modal-compare');
  const shareBtn = document.getElementById('modal-share');
  const variantsDiv = document.getElementById('modal-variants');
  const sizeOptions = document.getElementById('size-options');
  const colorOptions = document.getElementById('color-options');
  
  img.src = product.img; attachImgFallback(img);
  title.textContent = product.name;
  cat.textContent = product.category;
  desc.textContent = product.desc || '';
  price.textContent = formatPrice(product.price);
  
  // Rating display
  const rating = getProductRating(product.id);
  const reviewCount = getReviewCount(product.id);
  const modalStars = document.getElementById('modal-stars');
  const modalRatingText = document.getElementById('modal-rating-text');
  if (modalStars) modalStars.innerHTML = renderStars(rating);
  if (modalRatingText) modalRatingText.textContent = `Reyting: ${rating.toFixed(1)} (${reviewCount} sharh)`;
  
  // Reviews section
  renderProductReviews(product.id);
  
  // Variants
  if (variantsDiv && product.sizes && product.colors) {
    variantsDiv.style.display = 'block';
    
    // Initialize selected variants for this product
    if (!state.selectedVariants[product.id]) {
      state.selectedVariants[product.id] = {
        size: product.sizes[0] || 'M',
        color: product.colors[0] || 'Qora'
      };
    }
    
    const selected = state.selectedVariants[product.id];
    
    if (sizeOptions) {
      sizeOptions.innerHTML = product.sizes.map(s => {
        const isSelected = selected.size === s;
        return `<button class="variant-btn ${isSelected ? 'variant-btn--selected' : ''}" data-size="${s}">${s}</button>`;
      }).join('');
      
      // Add click handlers for size buttons
      sizeOptions.querySelectorAll('.variant-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const size = btn.getAttribute('data-size');
          state.selectedVariants[product.id].size = size;
          
          // Update UI
          sizeOptions.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('variant-btn--selected'));
          btn.classList.add('variant-btn--selected');
        });
      });
    }
    
    if (colorOptions) {
      colorOptions.innerHTML = product.colors.map(c => {
        const isSelected = selected.color === c;
        const colorValue = getColorValue(c);
        return `<div class="color-option-wrapper">
          <button class="variant-btn variant-btn--color ${isSelected ? 'variant-btn--selected' : ''}" data-color="${c}" style="background: ${colorValue}; border: 2px solid ${isSelected ? '#6a4af0' : 'transparent'}" title="${c}"></button>
          <span class="color-label">${c}</span>
        </div>`;
      }).join('');
      
      // Add click handlers for color buttons
      colorOptions.querySelectorAll('.variant-btn--color').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const color = btn.getAttribute('data-color');
          state.selectedVariants[product.id].color = color;
          
          // Update image with color filter
          updateProductImageColor(img, color);
          
          // Update UI
          colorOptions.querySelectorAll('.variant-btn--color').forEach(b => {
            b.classList.remove('variant-btn--selected');
            b.style.border = '2px solid transparent';
          });
          btn.classList.add('variant-btn--selected');
          btn.style.border = '2px solid #6a4af0';
        });
      });
      
      // Set initial color filter
      updateProductImageColor(img, selected.color);
    }
  }
  
  addCart.onclick = () => {
    const variant = state.selectedVariants[product.id] || { size: product.sizes?.[0] || 'M', color: product.colors?.[0] || 'Qora' };
    addToCart(product.id, variant.size, variant.color);
  };
  addFav.onclick = () => toggleFavorite(product.id, true);
  if (compareBtn) compareBtn.onclick = () => toggleCompare(product.id);
  if (shareBtn) shareBtn.onclick = () => shareProduct(product);
  modal.classList.add('modal--open');
}

// Update product image color with CSS filter
function updateProductImageColor(img, color) {
  if (!img) return;
  
  const colorFilters = {
    'Qora': 'brightness(0.3) saturate(1.2)',
    'Oq': 'brightness(1.5) saturate(0.8)',
    "Ko'k": 'hue-rotate(200deg) saturate(1.3)',
    'Qizil': 'hue-rotate(0deg) saturate(1.5) brightness(1.1)',
    'Yashil': 'hue-rotate(120deg) saturate(1.3)',
    'Sariq': 'hue-rotate(50deg) saturate(1.4) brightness(1.2)'
  };
  
  const filter = colorFilters[color] || '';
  img.style.filter = filter;
  img.style.transition = 'filter 0.3s ease';
}

function closeModal() {
  const modal = document.getElementById('product-modal');
  if (modal) modal.classList.remove('modal--open');
}


// Attempt to set author/brand photos from a list of asset paths
function setAuthorPhotoFromAssets(candidates) {
  const authorPhoto = document.getElementById('author-photo');
  const brandPhoto = document.getElementById('brand-photo');
  if (!authorPhoto && !brandPhoto) return;
  const tryNext = (i) => {
    if (i >= candidates.length) return;
    const url = candidates[i];
    const testImg = new Image();
    testImg.onload = () => {
      if (authorPhoto) authorPhoto.src = url;
      if (brandPhoto) brandPhoto.src = url;
    };
    testImg.onerror = () => tryNext(i+1);
    testImg.src = url;
  };
  tryNext(0);
}

// Compare functionality
function toggleCompare(id) {
  if (state.compare.has(id)) {
    state.compare.delete(id);
    toast("Solishtirishdan olib tashlandi");
  } else {
    if (state.compare.size >= 4) {
      toast("Maksimal 4 ta mahsulotni solishtirish mumkin");
      return;
    }
    state.compare.add(id);
    toast("Solishtirishga qo'shildi");
  }
  localStorage.setItem("compare", JSON.stringify(Array.from(state.compare)));
  updateCompareCount();
  renderProducts();
}

function updateCompareCount() {
  const countEl = document.getElementById('compare-count');
  if (countEl) countEl.textContent = String(state.compare.size);
}

function renderCompare() {
  const grid = document.getElementById('compare-grid');
  const empty = document.getElementById('compare-empty');
  if (!grid) return;
  
  if (state.compare.size < 2) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  grid.innerHTML = '';
  
  const products = Array.from(state.compare).map(id => state.products.find(p => p.id === id)).filter(Boolean);
  const frag = document.createDocumentFragment();
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'compare-card';
    const rating = getProductRating(product.id);
    card.innerHTML = `
      <button class="compare-remove" data-id="${product.id}" title="Solishtirishdan olib tashlash">×</button>
      <img src="${product.img}" alt="${product.name}">
      <h3>${product.name}</h3>
      <div class="compare-price">${formatPrice(product.price)}</div>
      <div class="compare-rating">${renderStars(rating)}</div>
      <div class="compare-category">${product.category}</div>
      <div class="compare-stock">${product.inStock ? 'Mavjud' : 'Mavjud emas'}</div>
      <div class="compare-sizes">O'lchamlar: ${product.sizes?.join(', ') || 'N/A'}</div>
      <button class="btn btn--primary compare-add-cart" data-id="${product.id}">Savatga solish</button>
      <button class="btn btn--danger compare-remove-btn" data-id="${product.id}">Solishtirishdan olib tashlash</button>
    `;
    const img = card.querySelector('img');
    attachImgFallback(img);
    
    // Remove button (X)
    card.querySelector('.compare-remove').onclick = () => toggleCompare(product.id);
    
    // Remove from compare button
    const removeBtn = card.querySelector('.compare-remove-btn');
    if (removeBtn) {
      removeBtn.onclick = () => toggleCompare(product.id);
    }
    
    // Add to cart button
    const addCartBtn = card.querySelector('.compare-add-cart');
    if (addCartBtn) {
      addCartBtn.onclick = () => {
        const variant = state.selectedVariants[product.id] || { size: product.sizes?.[0] || 'M', color: product.colors?.[0] || 'Qora' };
        addToCart(product.id, variant.size, variant.color);
      };
    }
    
    frag.appendChild(card);
  });
  
  grid.appendChild(frag);
}

// Recently viewed
function addToRecentlyViewed(id) {
  if (!state.recentlyViewed.includes(id)) {
    state.recentlyViewed.unshift(id);
    state.recentlyViewed = state.recentlyViewed.slice(0, 10);
    localStorage.setItem("recentlyViewed", JSON.stringify(state.recentlyViewed));
  }
}

function renderRecentlyViewed() {
  const grid = document.getElementById('recently-viewed-grid');
  const section = document.getElementById('recently-viewed');
  if (!grid || !section) return;
  
  if (state.recentlyViewed.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  grid.innerHTML = '';
  const products = state.recentlyViewed.map(id => state.products.find(p => p.id === id)).filter(Boolean).slice(0, 8);
  const frag = document.createDocumentFragment();
  products.forEach((p, idx) => frag.appendChild(productCard(p, idx)));
  grid.appendChild(frag);
}

// Recommendations
function renderRecommendations() {
  const grid = document.getElementById('recommendations-grid');
  const section = document.getElementById('recommendations');
  if (!grid || !section) return;
  
  // Get products based on favorites or random
  let recommended = [];
  if (state.favorites.size > 0) {
    const favCategories = Array.from(state.favorites).map(id => {
      const p = state.products.find(pr => pr.id === id);
      return p?.category;
    }).filter(Boolean);
    const mostFavCategory = favCategories.sort((a,b) => 
      favCategories.filter(v => v===a).length - favCategories.filter(v => v===b).length
    ).pop();
    recommended = state.products.filter(p => 
      p.category === mostFavCategory && !state.favorites.has(p.id)
    ).slice(0, 8);
  }
  
  if (recommended.length === 0) {
    recommended = state.products.filter(p => p.tags?.includes('Mashhur') || Math.random() > 0.7).slice(0, 8);
  }
  
  if (recommended.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  recommended.forEach((p, idx) => frag.appendChild(productCard(p, idx)));
  grid.appendChild(frag);
}

// Reviews and ratings
function getProductRating(productId) {
  const reviews = state.reviews.get(productId) || [];
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}

function getReviewCount(productId) {
  return (state.reviews.get(productId) || []).length;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
}

function renderProductReviews(productId) {
  const section = document.getElementById('reviews-section');
  const list = document.getElementById('reviews-list');
  if (!section || !list) return;
  
  const reviews = state.reviews.get(productId) || [];
  if (reviews.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  list.innerHTML = reviews.slice(-5).reverse().map(r => `
    <div class="review-item">
      <div class="review-header">
        <strong>${r.name}</strong>
        <span class="review-stars">${renderStars(r.rating)}</span>
        <span class="review-date">${new Date(r.date).toLocaleDateString('uz-UZ')}</span>
      </div>
      <p>${r.text}</p>
    </div>
  `).join('');
  
  const addReviewBtn = document.getElementById('add-review-btn');
  if (addReviewBtn) {
    addReviewBtn.onclick = () => openReviewModal(productId);
  }
}

function openReviewModal(productId) {
  const modal = document.getElementById('review-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  const form = document.getElementById('review-form');
  if (!form) return;
  
  let selectedRating = 0;
  const currentProductId = productId || (state.currentProduct && state.currentProduct.id);
  
  // Reset form
  form.reset();
  const stars = document.querySelectorAll('#star-rating .star');
  stars.forEach(s => s.style.color = '#ccc');
  
  stars.forEach((star, idx) => {
    star.onclick = () => {
      selectedRating = idx + 1;
      stars.forEach((s, i) => {
        s.style.color = i < selectedRating ? '#ffc107' : '#ccc';
        s.classList.toggle('active', i < selectedRating);
      });
    };
  });
  
  // Remove old listeners and add new one
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  document.getElementById('review-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('review-name').value;
    const text = document.getElementById('review-text').value;
    if (!selectedRating || !name || !text) {
      toast("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }
    
    if (!state.reviews.has(currentProductId)) {
      state.reviews.set(currentProductId, []);
    }
    state.reviews.get(currentProductId).push({
      name,
      rating: selectedRating,
      text,
      date: new Date().toISOString()
    });
    localStorage.setItem("reviews", JSON.stringify(Array.from(state.reviews.entries())));
    toast("Sharh qo'shildi!");
    closeReviewModal();
    if (state.currentProduct) {
      renderProductReviews(state.currentProduct.id);
    }
    renderProducts();
  });
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('review-form');
  if (form) form.reset();
  const stars = document.querySelectorAll('#star-rating .star');
  stars.forEach(s => {
    s.style.color = '#ccc';
    s.classList.remove('active');
  });
}

// Orders
function renderOrders() {
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');
  if (!list) return;
  
  if (state.orders.length === 0) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  
  list.style.display = 'block';
  if (empty) empty.style.display = 'none';
  list.innerHTML = state.orders.reverse().map(order => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <strong>Buyurtma #${order.id}</strong>
          <span class="order-date">${new Date(order.date).toLocaleDateString('uz-UZ')}</span>
        </div>
        <span class="order-status">${order.status}</span>
      </div>
      <div class="order-total">Jami: ${formatPrice(order.total)}</div>
      <button class="btn" onclick="printOrder('${order.id}')">Chop etish</button>
    </div>
  `).join('');
}

function printOrder(orderId) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head><title>Buyurtma ${order.id}</title></head>
      <body>
        <h1>Buyurtma #${order.id}</h1>
        <p>Sana: ${new Date(order.date).toLocaleString('uz-UZ')}</p>
        <p>Holat: ${order.status}</p>
        <p>Jami: ${formatPrice(order.total)}</p>
        <p>© ${new Date().getFullYear()} Abdulhay Boutique</p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Share product
function shareProduct(product) {
  if (navigator.share) {
    navigator.share({
      title: product.name,
      text: product.desc,
      url: window.location.href + '#product=' + product.id
    }).catch(() => {
      copyProductLink(product);
    });
  } else {
    copyProductLink(product);
  }
}

function copyProductLink(product) {
  const url = window.location.href + '#product=' + product.id;
  navigator.clipboard.writeText(url).then(() => {
    toast("Havola nusxalandi!");
  });
}

// Color helper
function getColorValue(color) {
  const colors = {
    'Qora': '#000000',
    'Oq': '#ffffff',
    "Ko'k": '#0066cc',
    'Qizil': '#cc0000',
    'Yashil': '#00cc00',
    'Sariq': '#ffcc00'
  };
  return colors[color] || '#cccccc';
}

// Newsletter
function closeNewsletterModal() {
  const modal = document.getElementById('newsletter-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Newsletter modal event listeners
function initNewsletterModal() {
  const modal = document.getElementById('newsletter-modal');
  if (!modal) return;
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeNewsletterModal();
    }
  });
  
  // Close on backdrop click (already handled in HTML)
}

// Price range filter
function attachPriceFilter() {
  const range = document.getElementById('price-range');
  const minEl = document.getElementById('price-min');
  const maxEl = document.getElementById('price-max');
  if (!range || !minEl || !maxEl) return;
  
  range.addEventListener('input', (e) => {
    state.filters.priceMax = parseInt(e.target.value);
    maxEl.textContent = state.filters.priceMax.toLocaleString('uz-UZ');
    state.page.shown = state.page.size;
    renderProducts();
  });
}


