// DailyBibleFuel Admin JavaScript
let currentProducts = [];
let currentContent = {};
let currentWorship = { english: [], telugu: [] };
let currentSubmissions = [];
let currentWorshipLang = 'english';

const AUTH_TOKEN_KEY = 'fuel_admin_token';

// Headers helper
function getAuthHeaders() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || 'fuel-admin-session-active';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Toast helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white';
  const icon = type === 'success' ? 'fa-check' : 'fa-triangle-exclamation';

  toast.className = `${bg} px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-xs font-medium transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-auto`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ----------------------------------------------------
// INITIALIZATION & AUTH
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  setupAuth();
  setupNavigation();
  await checkAuthStatus();
});

function setupAuth() {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('loginUsername').value.trim();
      const p = document.getElementById('loginPassword').value.trim();
      const errBox = document.getElementById('loginError');

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          document.getElementById('authModal').classList.add('hidden');
          showToast('Welcome back, Admin!');
          loadAllData();
        } else {
          errBox.textContent = data.message || 'Invalid credentials';
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errBox.textContent = 'Connection error: ' + err.message;
        errBox.classList.remove('hidden');
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      document.getElementById('authModal').classList.remove('hidden');
      showToast('Logged out successfully', 'info');
    });
  }
}

async function checkAuthStatus() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    document.getElementById('authModal').classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch('/api/admin/check-auth', {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.authenticated) {
      document.getElementById('authModal').classList.add('hidden');
      loadAllData();
    } else {
      document.getElementById('authModal').classList.remove('hidden');
    }
  } catch (e) {
    // Fallback: allow if offline/dev
    document.getElementById('authModal').classList.add('hidden');
    loadAllData();
  }
}

function loadAllData() {
  loadProducts();
  loadContent();
  loadWorship();
  loadSubmissions();
}

// ----------------------------------------------------
// NAVIGATION TABS
// ----------------------------------------------------
function setupNavigation() {
  window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');

    const btn = document.getElementById('btn-' + tabId);
    if (btn) btn.classList.add('active');
  };
}

// ----------------------------------------------------
// PRODUCTS MANAGEMENT
// ----------------------------------------------------
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    currentProducts = await res.json();
    renderProducts(currentProducts);
    const pill = document.getElementById('badgeCountPill');
    if (pill) pill.textContent = currentProducts.length;
  } catch (err) {
    console.error('Error fetching products:', err);
    showToast('Failed to load products: ' + err.message, 'error');
  }
}

function renderProducts(list) {
  const tbody = document.getElementById('productsTableBody');
  const empty = document.getElementById('noProductsFound');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!list || list.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  list.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';

    const imgUrl = p.image || 'assets/images/logo.png';
    const inStock = p.inStock !== false;

    tr.innerHTML = `
      <td class="p-4">
        <div class="flex items-center gap-3">
          <img src="${imgUrl}" alt="${p.title}" class="w-12 h-12 object-contain rounded-xl bg-white border border-slate-200 p-0.5">
          <div>
            ${p.badgeTag ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">${p.badgeTag}</span>` : ''}
          </div>
        </div>
      </td>
      <td class="p-4 max-w-xs">
        <p class="font-bold text-slate-800 text-xs">${p.title}</p>
        <p class="text-[11px] text-slate-400 truncate mt-0.5">${p.description || ''}</p>
      </td>
      <td class="p-4">
        <span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-medium">${p.category || 'Christian Badges'}</span>
      </td>
      <td class="p-4 font-semibold text-slate-400 line-through">
        ₹${p.price || 50}
      </td>
      <td class="p-4 font-bold text-[#D32F2F] text-sm">
        ₹${p.salePrice || 30}
      </td>
      <td class="p-4">
        <button onclick="toggleProductStock('${p.id}')" class="px-2.5 py-1 rounded-full text-[10px] font-bold transition ${inStock ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'}">
          ${inStock ? '● In Stock' : '○ Out of Stock'}
        </button>
      </td>
      <td class="p-4 text-right whitespace-nowrap">
        <div class="inline-flex items-center gap-1.5">
          <button onclick="editProduct('${p.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Product">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteProduct('${p.id}')" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Product">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterProducts() {
  const query = (document.getElementById('productSearch')?.value || '').toLowerCase();
  const category = document.getElementById('categoryFilter')?.value || 'ALL';

  const filtered = currentProducts.filter(p => {
    const matchQuery = (p.title || '').toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query);
    const matchCat = category === 'ALL' || p.category === category;
    return matchQuery && matchCat;
  });

  renderProducts(filtered);
}

// Open modal for new product
window.openProductModal = function() {
  document.getElementById('productForm').reset();
  document.getElementById('prodEditId').value = '';
  document.getElementById('productModalTitle').textContent = 'Add New Product / Badge';
  document.getElementById('prodImagePreview').src = 'assets/images/logo.png';
  document.getElementById('productModal').classList.remove('hidden');
};

window.closeProductModal = function() {
  document.getElementById('productModal').classList.add('hidden');
};

window.editProduct = function(id) {
  const p = currentProducts.find(item => String(item.id) === String(id));
  if (!p) return;

  document.getElementById('prodEditId').value = p.id;
  document.getElementById('prodTitle').value = p.title || '';
  document.getElementById('prodCategory').value = p.category || 'Christian Badges';
  document.getElementById('prodBadgeTag').value = p.badgeTag || '';
  document.getElementById('prodPrice').value = p.price || '';
  document.getElementById('prodSalePrice').value = p.salePrice || '';
  document.getElementById('prodImage').value = p.image || '';
  document.getElementById('prodDesc').value = p.description || '';
  document.getElementById('prodInStock').checked = p.inStock !== false;

  document.getElementById('prodImagePreview').src = p.image || 'assets/images/logo.png';
  document.getElementById('productModalTitle').textContent = 'Edit Product: ' + p.title;
  document.getElementById('productModal').classList.remove('hidden');
};

window.updateModalImagePreview = function(url) {
  document.getElementById('prodImagePreview').src = url || 'assets/images/logo.png';
};

// Handle file upload
window.handleImageFileUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const status = document.getElementById('uploadStatusText');
  status.textContent = 'Uploading...';

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ filename: file.name, base64Data })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('prodImage').value = data.url;
        document.getElementById('prodImagePreview').src = data.url;
        status.textContent = 'Uploaded successfully!';
        showToast('Image uploaded: ' + data.filename);
      } else {
        status.textContent = 'Upload failed: ' + (data.error || 'Server error');
      }
    } catch (err) {
      status.textContent = 'Upload error: ' + err.message;
    }
  };
  reader.readAsDataURL(file);
};

// Save product (Add or Update)
window.handleSaveProduct = async function(event) {
  event.preventDefault();
  const id = document.getElementById('prodEditId').value;
  const isEdit = Boolean(id);

  const productData = {
    title: document.getElementById('prodTitle').value.trim(),
    category: document.getElementById('prodCategory').value,
    badgeTag: document.getElementById('prodBadgeTag').value.trim(),
    price: parseFloat(document.getElementById('prodPrice').value) || 50,
    salePrice: parseFloat(document.getElementById('prodSalePrice').value) || 30,
    currency: '₹',
    image: document.getElementById('prodImage').value.trim() || 'assets/images/logo.png',
    description: document.getElementById('prodDesc').value.trim(),
    inStock: document.getElementById('prodInStock').checked
  };

  try {
    const url = isEdit ? `/api/products/${id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });

    const data = await res.json();
    if (res.ok) {
      showToast(isEdit ? 'Product updated successfully!' : 'Product added successfully!');
      closeProductModal();
      await loadProducts();
    } else {
      showToast(data.error || 'Failed to save product', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
};

window.toggleProductStock = async function(id) {
  const p = currentProducts.find(item => String(item.id) === String(id));
  if (!p) return;

  const updatedStock = !p.inStock;
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ inStock: updatedStock })
    });
    if (res.ok) {
      showToast(`${p.title} is now ${updatedStock ? 'In Stock' : 'Out of Stock'}`);
      await loadProducts();
    }
  } catch (err) {
    showToast('Failed to update stock: ' + err.message, 'error');
  }
};

window.deleteProduct = async function(id) {
  const p = currentProducts.find(item => String(item.id) === String(id));
  if (!confirm(`Are you sure you want to delete "${p ? p.title : 'this product'}"?`)) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      showToast('Product deleted successfully');
      await loadProducts();
    } else {
      showToast('Failed to delete product', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
};

// ----------------------------------------------------
// SITE CONTENT & HEADLINES
// ----------------------------------------------------
async function loadContent() {
  try {
    const res = await fetch('/api/content');
    currentContent = await res.json();

    // Populate Headlines & Hero
    if (currentContent.home) {
      const h = currentContent.home;
      if (document.getElementById('heroBadge')) document.getElementById('heroBadge').value = h.heroBadge || '';
      if (document.getElementById('heroTitle')) document.getElementById('heroTitle').value = h.heroTitle || '';
      if (document.getElementById('heroSubtitle')) document.getElementById('heroSubtitle').value = h.heroSubtitle || '';
      if (document.getElementById('primaryCtaText')) document.getElementById('primaryCtaText').value = h.primaryCtaText || '';
      if (document.getElementById('primaryCtaLink')) document.getElementById('primaryCtaLink').value = h.primaryCtaLink || '';
      if (document.getElementById('secondaryCtaText')) document.getElementById('secondaryCtaText').value = h.secondaryCtaText || '';
      if (document.getElementById('secondaryCtaLink')) document.getElementById('secondaryCtaLink').value = h.secondaryCtaLink || '';
      if (document.getElementById('heroStatNumber')) document.getElementById('heroStatNumber').value = h.heroStatNumber || '';
      if (document.getElementById('heroStatText')) document.getElementById('heroStatText').value = h.heroStatText || '';

      if (document.getElementById('heroCardBadge')) document.getElementById('heroCardBadge').value = h.heroCardBadge || '';
      if (document.getElementById('heroCardSubtitle')) document.getElementById('heroCardSubtitle').value = h.heroCardSubtitle || '';
      if (document.getElementById('heroAudioTitle')) document.getElementById('heroAudioTitle').value = h.heroAudioTitle || '';
      if (document.getElementById('heroAudioSubtitle')) document.getElementById('heroAudioSubtitle').value = h.heroAudioSubtitle || '';

      if (document.getElementById('quoteText')) document.getElementById('quoteText').value = h.quoteText || '';
      if (document.getElementById('founderName')) document.getElementById('founderName').value = h.founderName || 'Sis. Udaysree Gurajada';
      if (document.getElementById('founderTitle')) document.getElementById('founderTitle').value = h.founderTitle || 'Founder, DailyBibleFuel Ministry';
      if (document.getElementById('founderImage')) document.getElementById('founderImage').value = h.founderImage || 'assets/images/founder.jpeg';
      if (document.getElementById('founderImagePreview')) document.getElementById('founderImagePreview').src = h.founderImage || 'assets/images/founder.jpeg';

      if (document.getElementById('pathwaysTag')) document.getElementById('pathwaysTag').value = h.pathwaysTag || '';
      if (document.getElementById('pathwaysTitle')) document.getElementById('pathwaysTitle').value = h.pathwaysTitle || '';
      if (document.getElementById('pathwaysSubtitle')) document.getElementById('pathwaysSubtitle').value = h.pathwaysSubtitle || '';

      if (document.getElementById('badgesTag')) document.getElementById('badgesTag').value = h.badgesTag || '';
      if (document.getElementById('badgesTitle')) document.getElementById('badgesTitle').value = h.badgesTitle || '';
      if (document.getElementById('badgesLinkText')) document.getElementById('badgesLinkText').value = h.badgesLinkText || '';

      if (document.getElementById('aboutTag')) document.getElementById('aboutTag').value = h.aboutTag || '';
      if (document.getElementById('aboutTitle')) document.getElementById('aboutTitle').value = h.aboutTitle || '';
      if (document.getElementById('aboutLead')) document.getElementById('aboutLead').value = h.aboutLead || '';
      if (document.getElementById('aboutDescription')) document.getElementById('aboutDescription').value = h.aboutDescription || '';
      if (document.getElementById('aboutStat1Number')) document.getElementById('aboutStat1Number').value = h.aboutStat1Number || '';
      if (document.getElementById('aboutStat1Label')) document.getElementById('aboutStat1Label').value = h.aboutStat1Label || '';
      if (document.getElementById('aboutStat2Number')) document.getElementById('aboutStat2Number').value = h.aboutStat2Number || '';
      if (document.getElementById('aboutStat2Label')) document.getElementById('aboutStat2Label').value = h.aboutStat2Label || '';
      if (document.getElementById('aboutImage')) document.getElementById('aboutImage').value = h.aboutImage || '';
      if (document.getElementById('aboutImagePreview')) document.getElementById('aboutImagePreview').src = h.aboutImage || '';
      if (document.getElementById('aboutCtaText')) document.getElementById('aboutCtaText').value = h.aboutCtaText || "Read Today's Devotional";
      if (document.getElementById('aboutCtaLink')) document.getElementById('aboutCtaLink').value = h.aboutCtaLink || 'daily-verse.html';

      if (document.getElementById('ctaBannerTag')) document.getElementById('ctaBannerTag').value = h.ctaBannerTag || '';
      if (document.getElementById('ctaBannerTitle')) document.getElementById('ctaBannerTitle').value = h.ctaBannerTitle || '';
      if (document.getElementById('ctaBannerSubtitle')) document.getElementById('ctaBannerSubtitle').value = h.ctaBannerSubtitle || '';
      if (document.getElementById('ctaBannerBtn1Text')) document.getElementById('ctaBannerBtn1Text').value = h.ctaBannerBtn1Text || '';
      if (document.getElementById('ctaBannerBtn1Link')) document.getElementById('ctaBannerBtn1Link').value = h.ctaBannerBtn1Link || '';
      if (document.getElementById('ctaBannerBtn2Text')) document.getElementById('ctaBannerBtn2Text').value = h.ctaBannerBtn2Text || '';
      if (document.getElementById('ctaBannerBtn2Link')) document.getElementById('ctaBannerBtn2Link').value = h.ctaBannerBtn2Link || '';
      if (document.getElementById('ctaBannerBgImage')) document.getElementById('ctaBannerBgImage').value = h.ctaBannerBgImage || '';
    }

    // Populate Announcement & General
    if (currentContent.general) {
      if (document.getElementById('announcementText')) document.getElementById('announcementText').value = currentContent.general.announcementText || '';
      if (document.getElementById('siteSlogan')) document.getElementById('siteSlogan').value = currentContent.general.slogan || '';
      if (document.getElementById('contactPhone')) document.getElementById('contactPhone').value = currentContent.general.phone || '';
      if (document.getElementById('contactWhatsapp')) document.getElementById('contactWhatsapp').value = currentContent.general.whatsapp || '';
      if (document.getElementById('emailHello')) document.getElementById('emailHello').value = currentContent.general.emailHello || '';
      if (document.getElementById('emailInfo')) document.getElementById('emailInfo').value = currentContent.general.emailInfo || '';
      if (document.getElementById('contactInstagram')) document.getElementById('contactInstagram').value = currentContent.general.instagram || '';
      if (document.getElementById('contactYoutube')) document.getElementById('contactYoutube').value = currentContent.general.youtube || '';
    }

    // Populate Daily Verse & Devotional
    if (currentContent.dailyVerse) {
      document.getElementById('verseReference').value = currentContent.dailyVerse.reference || '';
      document.getElementById('verseTheme').value = currentContent.dailyVerse.theme || '';
      document.getElementById('verseEnglish').value = currentContent.dailyVerse.verseEnglish || '';
      document.getElementById('verseTelugu').value = currentContent.dailyVerse.verseTelugu || '';
      document.getElementById('verseReflection').value = currentContent.dailyVerse.reflection || '';
      document.getElementById('versePrayer').value = currentContent.dailyVerse.prayer || '';
    }

    // Populate Sermons & Videos
    if (currentContent.videos && currentContent.videos.featured) {
      renderVideos(currentContent.videos.featured);
    }
  } catch (err) {
    console.error('Error loading content:', err);
  }
}

window.previewImage = function(inputId, imgId) {
  const url = document.getElementById(inputId).value;
  document.getElementById(imgId).src = url;
};

window.handleFounderFileUpload = async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(evt) {
    const base64 = evt.target.result;
    document.getElementById('founderImagePreview').src = base64;
    try {
      showToast('Uploading founder photo...');
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ filename: file.name, dataUrl: base64 })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        document.getElementById('founderImage').value = data.imageUrl;
        document.getElementById('founderImagePreview').src = data.imageUrl;
        showToast('Founder photo uploaded successfully!');
      } else {
        document.getElementById('founderImage').value = base64;
      }
    } catch (err) {
      document.getElementById('founderImage').value = base64;
      showToast('Uploaded locally as data URL', 'info');
    }
  };
  reader.readAsDataURL(file);
};

window.handleAboutFileUpload = async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(evt) {
    const base64 = evt.target.result;
    document.getElementById('aboutImagePreview').src = base64;
    try {
      showToast('Uploading about photo...');
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ filename: file.name, dataUrl: base64 })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        document.getElementById('aboutImage').value = data.imageUrl;
        document.getElementById('aboutImagePreview').src = data.imageUrl;
        showToast('About photo uploaded successfully!');
      } else {
        document.getElementById('aboutImage').value = base64;
      }
    } catch (err) {
      document.getElementById('aboutImage').value = base64;
      showToast('Uploaded locally as data URL', 'info');
    }
  };
  reader.readAsDataURL(file);
};

window.saveSiteContent = async function() {
  const updatedContent = {
    general: {
      ...currentContent.general,
      announcementText: document.getElementById('announcementText')?.value.trim() || '',
      slogan: document.getElementById('siteSlogan')?.value.trim() || (currentContent.general?.slogan || 'Fill Up with Emmanuel'),
      phone: document.getElementById('contactPhone')?.value.trim() || '',
      whatsapp: document.getElementById('contactWhatsapp')?.value.trim() || '',
      emailHello: document.getElementById('emailHello')?.value.trim() || '',
      emailInfo: document.getElementById('emailInfo')?.value.trim() || '',
      instagram: document.getElementById('contactInstagram')?.value.trim() || '',
      youtube: document.getElementById('contactYoutube')?.value.trim() || ''
    },
    home: {
      ...currentContent.home,
      heroBadge: document.getElementById('heroBadge')?.value.trim() || '',
      heroTitle: document.getElementById('heroTitle')?.value.trim() || '',
      heroSubtitle: document.getElementById('heroSubtitle')?.value.trim() || '',
      primaryCtaText: document.getElementById('primaryCtaText')?.value.trim() || '',
      primaryCtaLink: document.getElementById('primaryCtaLink')?.value.trim() || 'daily-verse.html',
      secondaryCtaText: document.getElementById('secondaryCtaText')?.value.trim() || '',
      secondaryCtaLink: document.getElementById('secondaryCtaLink')?.value.trim() || 'videos-messages.html',
      heroStatNumber: document.getElementById('heroStatNumber')?.value.trim() || '15,000+ Believers',
      heroStatText: document.getElementById('heroStatText')?.value.trim() || 'reading today in English & Telugu',

      heroCardBadge: document.getElementById('heroCardBadge')?.value.trim() || 'Morning Scripture Focus',
      heroCardSubtitle: document.getElementById('heroCardSubtitle')?.value.trim() || "Today's Grace",
      heroAudioTitle: document.getElementById('heroAudioTitle')?.value.trim() || 'Audio Meditation',
      heroAudioSubtitle: document.getElementById('heroAudioSubtitle')?.value.trim() || '3 min listen • Rev. John',

      quoteText: document.getElementById('quoteText')?.value.trim() || '',
      founderName: document.getElementById('founderName')?.value.trim() || 'Sis. Udaysree Gurajada',
      founderTitle: document.getElementById('founderTitle')?.value.trim() || 'Founder, DailyBibleFuel Ministry',
      founderImage: document.getElementById('founderImage')?.value.trim() || 'assets/images/founder.jpeg',

      pathwaysTag: document.getElementById('pathwaysTag')?.value.trim() || 'Ministry Pathways',
      pathwaysTitle: document.getElementById('pathwaysTitle')?.value.trim() || 'Go Deeper in God’s Word',
      pathwaysSubtitle: document.getElementById('pathwaysSubtitle')?.value.trim() || '',

      badgesTag: document.getElementById('badgesTag')?.value.trim() || 'Official TrueMark Merch',
      badgesTitle: document.getElementById('badgesTitle')?.value.trim() || 'Featured Christian Badges',
      badgesLinkText: document.getElementById('badgesLinkText')?.value.trim() || 'View All Badges & Pins',

      aboutTag: document.getElementById('aboutTag')?.value.trim() || 'About DailyBibleFuel',
      aboutTitle: document.getElementById('aboutTitle')?.value.trim() || 'Helping You Grow Closer to God Every Day',
      aboutLead: document.getElementById('aboutLead')?.value.trim() || '',
      aboutDescription: document.getElementById('aboutDescription')?.value.trim() || '',
      aboutStat1Number: document.getElementById('aboutStat1Number')?.value.trim() || '365+',
      aboutStat1Label: document.getElementById('aboutStat1Label')?.value.trim() || '',
      aboutStat2Number: document.getElementById('aboutStat2Number')?.value.trim() || '100% Free',
      aboutStat2Label: document.getElementById('aboutStat2Label')?.value.trim() || '',
      aboutImage: document.getElementById('aboutImage')?.value.trim() || '',
      aboutCtaText: document.getElementById('aboutCtaText')?.value.trim() || "Read Today's Devotional",
      aboutCtaLink: document.getElementById('aboutCtaLink')?.value.trim() || 'daily-verse.html',

      ctaBannerTag: document.getElementById('ctaBannerTag')?.value.trim() || 'We Are Here For You',
      ctaBannerTitle: document.getElementById('ctaBannerTitle')?.value.trim() || '',
      ctaBannerSubtitle: document.getElementById('ctaBannerSubtitle')?.value.trim() || '',
      ctaBannerBtn1Text: document.getElementById('ctaBannerBtn1Text')?.value.trim() || 'Reach Out',
      ctaBannerBtn1Link: document.getElementById('ctaBannerBtn1Link')?.value.trim() || 'contact-us.html',
      ctaBannerBtn2Text: document.getElementById('ctaBannerBtn2Text')?.value.trim() || '+91 8019-777-939',
      ctaBannerBtn2Link: document.getElementById('ctaBannerBtn2Link')?.value.trim() || 'tel:+918019777939',
      ctaBannerBgImage: document.getElementById('ctaBannerBgImage')?.value.trim() || ''
    },
    dailyVerse: {
      ...currentContent.dailyVerse,
      reference: document.getElementById('verseReference')?.value.trim() || '',
      theme: document.getElementById('verseTheme')?.value.trim() || '',
      verseEnglish: document.getElementById('verseEnglish')?.value.trim() || '',
      verseTelugu: document.getElementById('verseTelugu')?.value.trim() || '',
      reflection: document.getElementById('verseReflection')?.value.trim() || '',
      prayer: document.getElementById('versePrayer')?.value.trim() || ''
    }
  };

  try {
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updatedContent)
    });
    const data = await res.json();
    if (res.ok) {
      currentContent = data.content;
      showToast('All website changes saved successfully!');
    } else {
      showToast(data.error || 'Failed to save changes', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
};

// ----------------------------------------------------
// SERMONS & VIDEOS MANAGEMENT
// ----------------------------------------------------
function renderVideos(videos) {
  const container = document.getElementById('videosGrid');
  if (!container) return;
  container.innerHTML = '';

  videos.forEach((v, index) => {
    const card = document.createElement('div');
    card.className = 'bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between';
    card.innerHTML = `
      <div class="space-y-2">
        <div class="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 relative">
          <iframe src="https://www.youtube.com/embed/${v.youtubeId}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
        </div>
        <div class="flex items-center gap-2">
          <span class="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">${v.series || 'Sermon'}</span>
          <span class="text-[11px] text-slate-400 font-mono">ID: ${v.youtubeId}</span>
        </div>
        <h4 class="font-bold text-xs text-[#163A63]">${v.title}</h4>
        <p class="text-[11px] text-slate-500 line-clamp-2">${v.description || ''}</p>
      </div>
      <div class="pt-3 mt-3 border-t border-slate-200 flex justify-end gap-2">
        <button onclick="editVideo(${index})" class="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">Edit</button>
        <button onclick="deleteVideo(${index})" class="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.openVideoModal = function() {
  document.getElementById('videoForm').reset();
  document.getElementById('videoEditId').value = '';
  document.getElementById('videoModalTitle').textContent = 'Add Sermon / Message';
  document.getElementById('videoModal').classList.remove('hidden');
};

window.closeVideoModal = function() {
  document.getElementById('videoModal').classList.add('hidden');
};

window.editVideo = function(index) {
  const v = currentContent.videos.featured[index];
  if (!v) return;

  document.getElementById('videoEditId').value = index;
  document.getElementById('vidTitle').value = v.title || '';
  document.getElementById('vidSeries').value = v.series || '';
  document.getElementById('vidYtId').value = v.youtubeId || '';
  document.getElementById('vidDesc').value = v.description || '';
  document.getElementById('videoModalTitle').textContent = 'Edit Sermon';
  document.getElementById('videoModal').classList.remove('hidden');
};

window.deleteVideo = async function(index) {
  if (!confirm('Are you sure you want to delete this video?')) return;
  currentContent.videos.featured.splice(index, 1);
  await saveSiteContent();
  renderVideos(currentContent.videos.featured);
  showToast('Video removed successfully');
};

window.handleSaveVideo = async function(event) {
  event.preventDefault();
  const editIndex = document.getElementById('videoEditId').value;
  const isEdit = editIndex !== '';

  let ytId = document.getElementById('vidYtId').value.trim();
  const match = ytId.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (match) ytId = match[1];

  const videoObj = {
    id: 'vid-' + Date.now(),
    title: document.getElementById('vidTitle').value.trim(),
    series: document.getElementById('vidSeries').value.trim() || 'Devotional Series',
    youtubeId: ytId,
    description: document.getElementById('vidDesc').value.trim()
  };

  if (!currentContent.videos) currentContent.videos = { featured: [] };
  if (!currentContent.videos.featured) currentContent.videos.featured = [];

  if (isEdit) {
    currentContent.videos.featured[parseInt(editIndex)] = { ...currentContent.videos.featured[parseInt(editIndex)], ...videoObj };
  } else {
    currentContent.videos.featured.unshift(videoObj);
  }

  await saveSiteContent();
  renderVideos(currentContent.videos.featured);
  closeVideoModal();
  showToast('Sermon saved successfully!');
};

// ----------------------------------------------------
// WORSHIP LYRICS MANAGEMENT
// ----------------------------------------------------
async function loadWorship() {
  try {
    const res = await fetch('/api/worship');
    currentWorship = await res.json();
    renderWorshipList();
    document.getElementById('countEngSongs').textContent = (currentWorship.english || []).length;
    document.getElementById('countTelSongs').textContent = (currentWorship.telugu || []).length;
  } catch (err) {
    console.error('Error loading worship lyrics:', err);
  }
}

window.switchWorshipLang = function(lang) {
  currentWorshipLang = lang;
  if (lang === 'english') {
    document.getElementById('worshipTabEng').className = 'px-4 py-2 bg-[#163A63] text-white rounded-xl text-xs font-semibold';
    document.getElementById('worshipTabTel').className = 'px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold';
  } else {
    document.getElementById('worshipTabTel').className = 'px-4 py-2 bg-[#163A63] text-white rounded-xl text-xs font-semibold';
    document.getElementById('worshipTabEng').className = 'px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold';
  }
  renderWorshipList();
};

function renderWorshipList() {
  const container = document.getElementById('songsList');
  if (!container) return;
  container.innerHTML = '';

  const list = currentWorship[currentWorshipLang] || [];
  if (list.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No songs added in ${currentWorshipLang} yet.</div>`;
    return;
  }

  list.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4';
    card.innerHTML = `
      <div class="space-y-1 max-w-xl">
        <div class="flex items-center gap-2">
          <span class="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">${s.theme || 'Worship'}</span>
          ${s.artist ? `<span class="text-xs text-slate-400 font-medium">By ${s.artist}</span>` : ''}
          ${s.transliteration ? `<span class="text-xs text-slate-500 italic">(${s.transliteration})</span>` : ''}
        </div>
        <h4 class="font-bold text-sm text-[#163A63]">${s.title}</h4>
        <p class="text-[11px] text-slate-500 font-mono whitespace-pre-line line-clamp-2">${s.lyrics || ''}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button onclick="editSong(${idx})" class="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-700">Edit</button>
        <button onclick="deleteSong(${idx})" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-medium text-red-600">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.openSongModal = function() {
  document.getElementById('songForm').reset();
  document.getElementById('songEditId').value = '';
  document.getElementById('songLang').value = currentWorshipLang;
  document.getElementById('songModalTitle').textContent = 'Add Worship Song';
  document.getElementById('songModal').classList.remove('hidden');
};

window.closeSongModal = function() {
  document.getElementById('songModal').classList.add('hidden');
};

window.editSong = function(index) {
  const s = currentWorship[currentWorshipLang][index];
  if (!s) return;

  document.getElementById('songEditId').value = index;
  document.getElementById('songLang').value = currentWorshipLang;
  document.getElementById('songTitle').value = s.title || '';
  document.getElementById('songTheme').value = s.theme || '';
  document.getElementById('songTranslit').value = s.transliteration || '';
  document.getElementById('songLyrics').value = s.lyrics || '';
  document.getElementById('songModalTitle').textContent = 'Edit Song: ' + s.title;
  document.getElementById('songModal').classList.remove('hidden');
};

window.deleteSong = async function(index) {
  if (!confirm('Are you sure you want to delete this song?')) return;
  currentWorship[currentWorshipLang].splice(index, 1);
  await saveWorshipSongs();
  renderWorshipList();
  showToast('Song deleted successfully');
};

window.handleSaveSong = async function(event) {
  event.preventDefault();
  const editIndex = document.getElementById('songEditId').value;
  const lang = document.getElementById('songLang').value;
  const isEdit = editIndex !== '';

  const songObj = {
    id: (lang === 'english' ? 'eng-' : 'tel-') + Date.now(),
    title: document.getElementById('songTitle').value.trim(),
    theme: document.getElementById('songTheme').value.trim() || 'Worship',
    transliteration: document.getElementById('songTranslit').value.trim(),
    lyrics: document.getElementById('songLyrics').value.trim()
  };

  if (!currentWorship[lang]) currentWorship[lang] = [];

  if (isEdit && lang === currentWorshipLang) {
    currentWorship[lang][parseInt(editIndex)] = { ...currentWorship[lang][parseInt(editIndex)], ...songObj };
  } else {
    currentWorship[lang].unshift(songObj);
  }

  await saveWorshipSongs();
  closeSongModal();
  renderWorshipList();
  showToast('Song saved successfully!');
};

async function saveWorshipSongs() {
  try {
    const res = await fetch('/api/worship', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(currentWorship)
    });
    if (!res.ok) throw new Error('Failed to save worship songs');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ----------------------------------------------------
// SUBMISSIONS & PRAYER REQUESTS
// ----------------------------------------------------
async function loadSubmissions() {
  try {
    const res = await fetch('/api/submissions', { headers: getAuthHeaders() });
    currentSubmissions = await res.json();
    renderSubmissions(currentSubmissions);
    const pill = document.getElementById('subCountPill');
    if (pill) pill.textContent = currentSubmissions.length;
  } catch (err) {
    console.error('Error loading submissions:', err);
  }
}

function renderSubmissions(list) {
  const container = document.getElementById('submissionsList');
  if (!container) return;
  container.innerHTML = '';

  if (!list || list.length === 0) {
    container.innerHTML = '<div class="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">No prayer requests or submissions yet.</div>';
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.type === 'Salvation Decision' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}">${item.type || 'Prayer Request'}</span>
          <span class="text-xs font-semibold text-slate-800">${item.name}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-slate-400">${item.date || ''}</span>
          <button onclick="deleteSubmission('${item.id}')" class="text-slate-400 hover:text-red-600 transition text-xs p-1"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <p class="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">${item.message || '(No message)'}</p>
      <div class="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-1">
        ${item.email ? `<span><i class="fa-solid fa-envelope mr-1 text-slate-400"></i><a href="mailto:${item.email}" class="hover:text-blue-600">${item.email}</a></span>` : ''}
        ${item.phone ? `<span><i class="fa-solid fa-phone mr-1 text-slate-400"></i><a href="tel:${item.phone}" class="hover:text-blue-600">${item.phone}</a></span>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

window.deleteSubmission = async function(id) {
  if (!confirm('Remove this submission?')) return;
  try {
    const res = await fetch(`/api/submissions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      showToast('Submission removed');
      loadSubmissions();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};
