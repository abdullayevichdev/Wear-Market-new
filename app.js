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
  cart: new Map(JSON.parse(localStorage.getItem("cart") || "[]")), // id -> {product, qty}
  filters: { q: "", category: "all", sort: "default" },
  promo: null,
  shipping: { method: "standard" },
  page: { size: 12, shown: 12 },
  galleryRendered: false
};

// Utilities
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const formatPrice = v => `${v.toLocaleString("uz-UZ")} so'm`;
const toast = (msg) => {
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
        desc: makeDesc(name, cat, imgUrl)
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

// Theme management
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.textContent = mode === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(mode);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

const PRODUCT_DATA = buildProducts();

state.products = [...PRODUCT_DATA];

// Routing between views
function setView(view) {
  $$(".view").forEach(v => v.classList.remove("view--active"));
  const target = $(`.view[data-view="${view}"]`);
  if (target) target.classList.add("view--active");
  if (view === 'home' && !state.galleryRendered) {
    renderGallery();
  }
}

// Render products
function renderProducts() {
  const grid = $("#product-grid");
  grid.innerHTML = "";
  let items = state.products.filter(p =>
    (state.filters.category === "all" || p.category === state.filters.category) &&
    (state.filters.q === "" || p.name.toLowerCase().includes(state.filters.q))
  );
  switch (state.filters.sort) {
    case "price-asc": items.sort((a,b)=>a.price-b.price); break;
    case "price-desc": items.sort((a,b)=>b.price-a.price); break;
    case "name-asc": items.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "name-desc": items.sort((a,b)=>b.name.localeCompare(a.name)); break;
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
    loadMore.onclick = () => { state.page.shown += state.page.size; renderProducts(); };
  }
}

function productCard(product, idx=0) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.setProperty('--i', String(idx));
  card.innerHTML = `
    <div class="card__media">
      <img loading=\"lazy\" decoding=\"async\" sizes=\"(max-width: 600px) 50vw, 25vw\" src=\"${product.img}\" alt=\"${product.name}\">
      <button class="card__fav" aria-label="Sevimlilarga qo'shish" data-id="${product.id}">❤</button>
    </div>
    <div class="card__body">
      <div class="card__title">${product.name}</div>
      <div class="card__meta"><span class="muted">${product.category}</span><span class="price">${formatPrice(product.price)}</span></div>
      <div class="card__actions">
        <button type="button" class="btn btn--primary add-cart" data-id="${product.id}">Savatga solish</button>
        <button type="button" class="btn add-fav" data-id="${product.id}">Sevimli</button>
      </div>
    </div>`;

  const favBtn = card.querySelector(".card__fav");
  const addFavBtn = card.querySelector(".add-fav");
  const addCartBtn = card.querySelector(".add-cart");
  const imgEl = card.querySelector("img");
  attachImgFallback(imgEl);
  card.querySelector('.card__media').addEventListener('click', () => openProductModal(product));
  const updateFavUI = () => {
    const isFav = state.favorites.has(product.id);
    favBtn.textContent = isFav ? "💜" : "❤";
  };
  favBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id, true); });
  addFavBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id, true); });
  addCartBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); });
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
function addToCart(id) {
  try { console.debug('[cart] addToCart clicked', id); } catch(_) {}
  const product = state.products.find(p => p.id === id);
  if (!product) return;
  const current = state.cart.get(id);
  const qty = current ? current.qty + 1 : 1;
  state.cart.set(id, { product, qty });
  persistCart();
  renderCart();
  updateCartCount();
  toast("Savatga qo'shildi");
}

function changeQty(id, delta) {
  const row = state.cart.get(id);
  if (!row) return;
  const next = Math.max(1, row.qty + delta);
  row.qty = next;
  state.cart.set(id, row);
  persistCart();
  renderCart();
  updateCartCount();
}

function removeFromCart(id) {
  state.cart.delete(id);
  persistCart();
  renderCart();
  updateCartCount();
}

function persistCart() {
  localStorage.setItem("cart", JSON.stringify(Array.from(state.cart.entries())));
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
  list.innerHTML = "";
  if (state.cart.size === 0) {
    list.innerHTML = `<div class="card" style="padding:16px;">Savat bo'sh. Katalogdan mahsulot qo'shing.</div>`;
    renderCartProductsGrid([]);
  } else {
    state.cart.forEach(({ product, qty }) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img loading="lazy" decoding="async" src="${product.img}" alt="${product.name}">
        <div>
          <div style="font-weight:700;">${product.name}</div>
          <div class="muted">${formatPrice(product.price)}</div>
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="qty">
            <button aria-label="Kamaytirish">−</button>
            <span>${qty}</span>
            <button aria-label="Ko'paytirish">+</button>
          </div>
          <button class="btn" aria-label="O'chirish">O'chirish</button>
        </div>`;
      const img = row.querySelector('img');
      attachImgFallback(img);
      const [decBtn, incBtn] = row.querySelectorAll(".qty button");
      const delBtn = row.querySelector(".btn");
      if (decBtn) decBtn.addEventListener("click", () => changeQty(product.id, -1));
      if (incBtn) incBtn.addEventListener("click", () => changeQty(product.id, +1));
      if (delBtn) delBtn.addEventListener("click", () => removeFromCart(product.id));
      list.appendChild(row);
    });
    renderCartProductsGrid(Array.from(state.cart.values()).map(v => v.product));
  }
  $("#cart-total").textContent = formatPrice(cartTotal());
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
}

// Navigation
function attachNav() {
  $$("[data-view]").forEach(el => {
    el.addEventListener("click", (e) => {
      const view = el.getAttribute("data-view");
      if (view && el.tagName !== "A") setView(view);
    });
  });
  $$(".footer__links a").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const view = a.getAttribute("data-view");
      setView(view);
    });
  });
  $("#go-checkout").addEventListener("click", () => {
    setView("cart");
    $("#checkout").scrollIntoView({ behavior: "smooth" });
  });
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
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
    const order = { id: orderId, status: 'Qabul qilindi', total, date: new Date().toISOString() };
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
  $("#year").textContent = String(new Date().getFullYear());
  document.title = `${CREATOR_FULL} | Kiyim Do'koni`;
  attachNav();
  attachFilters();
  attachCheckoutForm();
  // Open catalog directly
  setView('catalog');
  renderProducts();
  attachProductGridDelegation();
  renderFavorites();
  renderCart();
  updateCartCount();
  updateCartSummaryUI();
  // author photo fallback
  const authorPhoto = $("#author-photo");
  if (authorPhoto) attachImgFallback(authorPhoto);
  const brandPhoto = $("#brand-photo");
  if (brandPhoto) attachImgFallback(brandPhoto);
  // Load persisted uploaded photo
  const saved = localStorage.getItem('authorPhotoData');
  if (saved) {
    if (authorPhoto) authorPhoto.src = saved;
    if (brandPhoto) brandPhoto.src = saved;
  } else {
    setAuthorPhotoFromAssets(["assets/oppa uzim.jpg","assets/oppa uzim.jpeg","assets/oppa uzim.png","assets/oppa uzim.webp"]);
  }
  attachPhotoUploader();

  // Initialize theme from storage or prefers-color-scheme
  initTheme();
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
  const img = document.getElementById('modal-img');
  const title = document.getElementById('modal-title');
  const cat = document.getElementById('modal-category');
  const desc = document.getElementById('modal-desc');
  const price = document.getElementById('modal-price');
  const addCart = document.getElementById('modal-add-cart');
  const addFav = document.getElementById('modal-add-fav');
  img.src = product.img; attachImgFallback(img);
  title.textContent = product.name;
  cat.textContent = product.category;
  desc.textContent = product.desc || '';
  price.textContent = formatPrice(product.price);
  addCart.onclick = () => addToCart(product.id);
  addFav.onclick = () => toggleFavorite(product.id, true);
  modal.classList.add('modal--open');
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


