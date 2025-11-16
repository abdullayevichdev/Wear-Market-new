// Language translations
const translations = {
  uz: {
    // Navigation
    home: 'Bosh sahifa',
    catalog: 'Mahsulotlar',
    favorites: 'Sevimlilar',
    author: 'Muallif',
    cart: 'Savat',
    settings: 'Sozlamalar',
    
    // Settings
    settingsTitle: 'Sozlamalar',
    languageTitle: 'Tilni tanlang',
    themeTitle: 'Mavzu',
    lightTheme: 'Kunduzgi',
    darkTheme: 'Tungi',
    
    // Hero section
    heroTitle: 'Ushbu sayt yaratuvchisi: Abdulhay Avazxanov',
    heroText: 'U yosh bo\'lishiga qaramasdan ko\'plab saytlar yaratgan va eng mukammal yaratgan sayti aynan shu sayt hisoblanadi! U LSL SCHOOL xususiy maktabida tahsil oladi. 3 yildan buyon Media olamida, Kompyuter Savodxonligi, Robotexnika, Grafik Dizayn va Webdizayn bo\'yicha tajribaga ega. Abdulhay bilan bog\'lanish uchun telefon raqam: +998933223580 — doimo aloqada!',
    viewCatalog: 'Katalogni ko\'rish',
    
    // Footer
    copyright: '© {year} Abdulhay Avazxanov | Abdulhay Boutique',
    
    // Other text
    loading: 'Yuklanmoqda...',
    close: 'Yopish'
  },
  en: {
    // Navigation
    home: 'Home',
    catalog: 'Products',
    favorites: 'Favorites',
    author: 'Author',
    cart: 'Cart',
    settings: 'Settings',
    
    // Settings
    settingsTitle: 'Settings',
    languageTitle: 'Select Language',
    themeTitle: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    
    // Hero section
    heroTitle: 'Website Creator: Abdulhay Avazxanov',
    heroText: 'Despite his young age, he has created many websites, and this one is considered his best work! He studies at LSL SCHOOL private school. For the past 3 years, he has been gaining experience in Media, Computer Literacy, Robotics, Graphic Design, and Web Design. Contact Abdulhay at: +998933223580 — always in touch!',
    viewCatalog: 'View Catalog',
    
    // Footer
    copyright: '© {year} Abdulhay Avazxanov | Abdulhay Boutique',
    
    // Other text
    loading: 'Loading...',
    close: 'Close'
  }
};

// Current language
let currentLang = localStorage.getItem('language') || 'uz';

// DOM Elements
const settingsModal = document.getElementById('settings-modal');
const settingsToggle = document.getElementById('settings-toggle');
const closeSettings = document.getElementById('close-settings');
const languageOptions = document.querySelectorAll('.language-option');
const themeOptions = document.querySelectorAll('.theme-option');

// Initialize settings
function initSettings() {
  // Set initial language
  setLanguage(currentLang);
  
  // Set initial theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  
  // Highlight active theme button
  if (themeOptions && themeOptions.length > 0) {
    themeOptions.forEach(option => {
      if (option.dataset.theme === savedTheme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  // Initialize event listeners
  initializeEventListeners();
}

// Initialize event listeners
function initializeEventListeners() {
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal && settingsModal.style.display === 'flex') {
      closeSettingsModal();
    }
  });
  
  // Close modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        closeSettingsModal();
      }
    });
  }
  
  // Language selection
  if (languageOptions && languageOptions.length > 0) {
    languageOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = option.dataset.lang;
        setLanguage(lang);
        // Update active state
        languageOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
      });
    });
  }
  
  // Theme selection
  if (themeOptions && themeOptions.length > 0) {
    themeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = option.dataset.theme;
        setTheme(theme);
        // Update active state
        themeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
      });
    });
  }
  
  // Event listeners - make sure elements exist before adding listeners
  if (settingsToggle) {
    settingsToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSettings();
    });
  }
  
  if (closeSettings) {
    closeSettings.addEventListener('click', (e) => {
      e.preventDefault();
      closeSettingsModal();
    });
  }
}

// Toggle settings modal
function toggleSettings() {
  console.log('Settings button clicked'); // Debug log
  if (!settingsModal) {
    console.error('Settings modal not found!');
    return;
  }
  
  if (settingsModal.style.display === 'flex') {
    closeSettingsModal();
  } else {
    openSettingsModal();
  }
}

function openSettingsModal() {
  console.log('Opening settings modal'); // Debug log
  if (!settingsModal) {
    console.error('Cannot open: settings modal not found');
    return;
  }
  
  settingsModal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  
  // Update active states when opening the modal
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  themeOptions.forEach(option => {
    if (option.dataset.theme === currentTheme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
  
  // Update language selection
  if (languageOptions && languageOptions.length > 0) {
    languageOptions.forEach(option => {
      if (option.dataset.lang === currentLang) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  } else {
    console.warn('No language options found');
  }
  
  console.log('Modal should be visible now');
}

function closeSettingsModal() {
  if (!settingsModal) return;
  settingsModal.style.display = 'none';
  document.body.style.overflow = ''; // Re-enable scrolling
}

// Set language
function setLanguage(lang) {
  if (currentLang === lang) return; // Don't update if language hasn't changed
  
  currentLang = lang;
  localStorage.setItem('language', lang);
  
  // Update all text content
  updateTextContent();
  updateDynamicContent();
  
  // Force re-render of views that might have dynamic content
  const currentView = document.querySelector('.view--active');
  if (currentView) {
    const viewName = currentView.getAttribute('data-view');
    if (viewName === 'catalog') {
      window.renderProducts && window.renderProducts();
    } else if (viewName === 'favorites') {
      window.renderFavorites && window.renderFavorites();
    } else if (viewName === 'cart') {
      window.renderCart && window.renderCart();
    }
  }
}

// Set theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Update all text content based on current language
function updateTextContent() {
  // Update elements with data-i18n attribute
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLang] && translations[currentLang][key] !== undefined) {
      // Only update if the element is visible or we're forcing an update
      if (element.offsetParent !== null || element.closest('.modal')) {
        element.textContent = translations[currentLang][key];
      }
    }
  });
  
  // Update attributes like placeholders and titles
  const attrElements = document.querySelectorAll('[data-i18n-attr]');
  attrElements.forEach(element => {
    const [attr, key] = element.getAttribute('data-i18n-attr').split(':');
    if (translations[currentLang] && translations[currentLang][key] !== undefined) {
      element.setAttribute(attr, translations[currentLang][key]);
    }
  });
  
  // Update copyright year with translation
  const yearElement = document.getElementById('year');
  if (yearElement) {
    const year = new Date().getFullYear();
    const copyrightText = translations[currentLang]?.copyright?.replace('{year}', year) || `© ${year} ${CREATOR_FULL}`;
    yearElement.textContent = copyrightText;
  }
}

// Update dynamic content that might not have data-i18n attributes
function updateDynamicContent() {
  if (!translations[currentLang]) return; // Make sure translations exist for current language
  
  // Update navigation
  const navLinks = document.querySelectorAll('.nav__link');
  navLinks.forEach(link => {
    const view = link.getAttribute('data-view');
    if (view && translations[currentLang][view] !== undefined) {
      // Don't override cart count
      if (view === 'cart') {
        const count = link.querySelector('.badge');
        if (count) {
          link.innerHTML = `${translations[currentLang][view]} <span class="badge">${count.textContent}</span>`;
        } else {
          link.textContent = translations[currentLang][view];
        }
      } else if (view !== 'settings') { // Skip settings button if it has custom text
        link.textContent = translations[currentLang][view];
      }
    }
  });
  
  // Update hero section
  const heroTitle = document.querySelector('.hero__title');
  const heroText = document.querySelector('.hero__text');
  const heroButton = document.querySelector('.hero__actions .btn--primary');
  
  if (heroTitle && translations[currentLang].heroTitle) {
    heroTitle.textContent = translations[currentLang].heroTitle;
  }
  
  if (heroText && translations[currentLang].heroText) {
    heroText.textContent = translations[currentLang].heroText;
  }
  
  if (heroButton && translations[currentLang].viewCatalog) {
    heroButton.textContent = translations[currentLang].viewCatalog;
  }
  
  // Update cart page elements
  const cartTitle = document.querySelector('.cart .section-title');
  if (cartTitle && translations[currentLang].cart) {
    cartTitle.textContent = translations[currentLang].cart;
  }
  
  // Update favorites page title
  const favTitle = document.querySelector('.favorites .section-title');
  if (favTitle && translations[currentLang].favorites) {
    favTitle.textContent = translations[currentLang].favorites;
  }
  
  // Update catalog page title
  const catalogTitle = document.querySelector('.catalog .section-title');
  if (catalogTitle && translations[currentLang].catalog) {
    catalogTitle.textContent = translations[currentLang].catalog;
  }
  
  // Update author page title
  const authorTitle = document.querySelector('.author .section-title');
  if (authorTitle && translations[currentLang].author) {
    authorTitle.textContent = translations[currentLang].author;
  }
  
  // Update cart summary labels
  const summaryLabels = {
    'cart-subtotal': 'subtotal',
    'cart-discount': 'discount',
    'cart-shipping': 'shipping',
    'cart-total': 'total'
  };
  
  Object.entries(summaryLabels).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element && translations[currentLang][key]) {
      const value = element.textContent.match(/\d+/)?.[0] || '0';
      element.textContent = `${translations[currentLang][key]}: ${value} so'm`;
    }
  });
  
  // Update cart action buttons
  const applyPromoBtn = document.getElementById('apply-promo');
  if (applyPromoBtn && translations[currentLang].apply) {
    applyPromoBtn.textContent = translations[currentLang].apply;
  }
  
  const checkoutBtn = document.getElementById('go-checkout');
  if (checkoutBtn && translations[currentLang].checkout) {
    checkoutBtn.textContent = translations[currentLang].checkout;
  }
  
  // Update promo input placeholder
  const promoInput = document.getElementById('promo-input');
  if (promoInput && translations[currentLang].promoPlaceholder) {
    promoInput.placeholder = translations[currentLang].promoPlaceholder;
  }
  
  // Update shipping method options
  const shippingMethod = document.getElementById('shipping-method');
  if (shippingMethod) {
    const options = shippingMethod.querySelectorAll('option');
    options.forEach(option => {
      const value = option.value;
      if (translations[currentLang][`shipping_${value}`]) {
        option.textContent = translations[currentLang][`shipping_${value}`];
      }
    });
  }
}

// Initialize when DOM is loaded
function initializeSettings() {
  console.log('Initializing settings...');
  
  // Make sure elements exist
  if (!settingsModal) console.error('Settings modal element not found');
  if (!settingsToggle) console.error('Settings toggle button not found');
  
  // Initialize settings (this will call initializeEventListeners)
  initSettings();
  
  console.log('Settings initialization complete');
}

// Start initialization when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSettings);
} else {
  // DOMContentLoaded has already fired
  initializeSettings();
}

// Export functions for use in other files
window.Settings = {
  setLanguage,
  getCurrentLanguage: () => currentLang,
  translate: (key) => translations[currentLang][key] || key
};
