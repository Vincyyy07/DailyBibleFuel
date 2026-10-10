/**
 * DailyBibleFuel - Shared Interactive JavaScript Engine
 * Handles Navigation, Mobile Drawer, Shopping Cart, Notifications, and Common Interactivity
 */

(function () {
  'use strict';

  // --- 1. TOAST NOTIFICATION SYSTEM ---
  window.showToast = function (message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-red-700 text-white' : type === 'info' ? 'bg-[#163A63] text-white' : 'bg-[#163A63] text-white border-l-4 border-[#D32F2F]';
    const icon = type === 'error' ? 'error' : type === 'info' ? 'info' : 'check_circle';

    toast.className = `${bgClass} pointer-events-auto px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300 max-w-md`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[20px] text-[#D4A359]">${icon}</span>
      <span class="flex-1">${message}</span>
      <button class="text-white/70 hover:text-white" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined text-[16px]">close</span>
      </button>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // --- 2. GLOBAL SHOPPING CART SYSTEM ---
  const CART_KEY = 'dbf_cart_items';
  
  function getCart() {
    try {
      const items = localStorage.getItem(CART_KEY);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      updateCartBadge();
      renderCartDrawer();
    } catch (e) {
      console.error(e);
    }
  }

  window.addItemToCart = window.addToCart = window.addItem = function (title, price, image = '') {
    ensureCartDOM();
    const cart = getCart();
    const existing = cart.find(item => item.title === title);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: Date.now(),
        title: title,
        price: Number(price),
        quantity: 1,
        image: image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5j8Zyuf5KclbMhZOy2dfSr20wi0t-4afJOOQ-AN095k60KOK1KShsFNBlP28gJdsWQ8Z2wCmw3yt1kPDIyAY70valEplIzuSuZjaU1PbTb613kQJ4z9R4UJkQXygUDTZK8y54FHs4XhlJeGCWbXESs4s2AzHOqQ9tWzHi8xCreFKRzynaZ1J9RVUW8g4yKv5-Xw9J8jJCa5ODTTVtToDO_jWkciFqz7P0O0Tpn04'
      });
    }
    saveCart(cart);
    window.showToast(`Added "${title}" to your cart!`);
    window.openCartDrawer();
  };

  window.updateCartQuantity = function (id, delta) {
    let cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== id);
    }
    saveCart(cart);
  };

  window.removeCartItem = function (id) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    window.showToast('Item removed from cart', 'info');
  };

  function updateCartBadge() {
    const cart = getCart();
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge-count, #cartCountBadge').forEach(el => {
      el.textContent = totalCount;
      if (el.classList.contains('cart-badge-count')) {
        el.style.display = totalCount > 0 ? 'flex' : 'none';
      }
    });

    const stickyBar = document.getElementById('stickyOrderBar');
    const summaryText = document.getElementById('cartSummaryText');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    if (stickyBar) {
      if (totalCount > 0) {
        stickyBar.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
        stickyBar.classList.add('translate-y-0', 'opacity-100');
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        if (summaryText) summaryText.textContent = `${totalCount} item${totalCount > 1 ? 's' : ''} selected`;
        if (totalPriceEl) totalPriceEl.textContent = `₹${subtotal}`;
      } else {
        stickyBar.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
        stickyBar.classList.remove('translate-y-0', 'opacity-100');
      }
    }
  }

  // --- 3. CART DRAWER & CHECKOUT MODAL ---
  function ensureCartDOM() {
    if (document.getElementById('global-cart-drawer')) return;
    const drawerHTML = `
      <div id="global-cart-drawer" class="fixed inset-0 z-[90] hidden">
        <div id="cart-drawer-backdrop" onclick="closeCartDrawer()" class="fixed inset-0 bg-[#0F2642]/60 backdrop-blur-sm transition-opacity"></div>
        <div class="fixed top-0 right-0 bottom-0 w-96 max-w-full bg-[#FAF8F5] shadow-2xl flex flex-col justify-between border-l border-[#E8E2D9] z-10">
          <div class="p-5 border-b border-[#E8E2D9] bg-[#FFFFFF] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[#D32F2F] text-[24px]">shopping_bag</span>
              <h3 class="font-bold text-lg text-[#163A63]">Your Faith Cart</h3>
            </div>
            <button onclick="closeCartDrawer()" class="p-2 text-gray-500 hover:text-black rounded-lg">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div class="p-5 flex-grow overflow-y-auto space-y-3" id="cart-items-container"></div>
          
          <div id="cart-empty-message" class="hidden flex-col items-center justify-center p-8 text-center text-gray-500 flex-grow">
            <span class="material-symbols-outlined text-gray-400 text-[48px] mb-2">production_quantity_limits</span>
            <p class="font-semibold text-[#163A63]">Your cart is empty</p>
            <p class="text-xs text-gray-500 mt-1">Explore our Christian badges and faith resources!</p>
            <a href="shop.html?category=badges" onclick="closeCartDrawer()" class="mt-4 px-4 py-2 bg-[#D32F2F] text-white text-xs font-semibold rounded-lg shadow-sm">Browse Christian Badges</a>
          </div>

          <div id="cart-drawer-footer" class="p-5 border-t border-[#E8E2D9] bg-[#FFFFFF] space-y-3">
            <div class="flex justify-between text-xs text-gray-600">
              <span>Subtotal:</span>
              <span id="cart-subtotal" class="font-bold text-[#163A63]">₹0</span>
            </div>
            <div class="flex justify-between text-xs text-gray-600">
              <span>Shipping (Free over ₹499):</span>
              <span id="cart-shipping" class="font-semibold text-emerald-600">₹0</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-[#163A63] pt-2 border-t border-gray-100">
              <span>Total:</span>
              <span id="cart-grand-total" class="text-[#D32F2F]">₹0</span>
            </div>
            <button onclick="checkoutCart()" class="w-full py-3 bg-[#D32F2F] hover:bg-[#B71C1C] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[18px]">lock</span>
              <span>Proceed to Checkout</span>
            </button>
            <button onclick="orderViaWhatsApp()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[16px]">chat</span>
              <span>Fast WhatsApp Order</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Checkout Modal -->
      <div id="checkout-modal" class="fixed inset-0 z-[95] hidden items-center justify-center p-4 bg-[#0F2642]/70 backdrop-blur-sm transition-opacity">
        <div class="bg-[#FAF8F5] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E2D9] relative">
          <button onclick="closeCheckoutModal()" class="absolute top-4 right-4 text-gray-400 hover:text-black">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div class="flex items-center gap-2 text-[#D32F2F] mb-1">
            <span class="material-symbols-outlined text-[22px]">verified_user</span>
            <span class="text-xs uppercase font-bold tracking-wider">Secure Faith Order</span>
          </div>
          <h3 class="text-xl font-bold text-[#163A63] mb-3">Delivery Information</h3>
          <form onsubmit="processOrder(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-[#163A63] mb-1">Full Name *</label>
              <input type="text" id="checkout-name" required placeholder="Your name" class="w-full px-3 py-2 rounded-lg bg-white border border-[#E8E2D9] text-sm focus:outline-none focus:ring-1 focus:ring-[#1DA1E8]">
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#163A63] mb-1">Phone / WhatsApp Number *</label>
              <input type="tel" id="checkout-phone" required placeholder="+91 98765-43210" class="w-full px-3 py-2 rounded-lg bg-white border border-[#E8E2D9] text-sm focus:outline-none focus:ring-1 focus:ring-[#1DA1E8]">
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#163A63] mb-1">Delivery Address & PIN Code *</label>
              <textarea required rows="2" placeholder="House / Street, City, State, PIN" class="w-full px-3 py-2 rounded-lg bg-white border border-[#E8E2D9] text-sm focus:outline-none focus:ring-1 focus:ring-[#1DA1E8]"></textarea>
            </div>
            <div>
              <label class="block text-xs font-semibold text-[#163A63] mb-1">Payment Method</label>
              <div class="space-y-1 text-xs">
                <label class="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E8E2D9] cursor-pointer">
                  <input type="radio" name="payment" checked class="text-[#006494]">
                  <span>UPI / Google Pay / PhonePe (WhatsApp invoice)</span>
                </label>
                <label class="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E8E2D9] cursor-pointer">
                  <input type="radio" name="payment" class="text-[#006494]">
                  <span>Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>
            <button type="submit" class="w-full py-3 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold rounded-xl text-sm shadow-md mt-2 flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Confirm & Place Order</span>
            </button>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', drawerHTML);
  }

  window.openCartDrawer = function () {
    ensureCartDOM();
    const drawer = document.getElementById('global-cart-drawer');
    if (drawer) {
      renderCartDrawer();
      drawer.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeCartDrawer = function () {
    const drawer = document.getElementById('global-cart-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
      document.body.style.overflow = '';
    }
  };

  function renderCartDrawer() {
    ensureCartDOM();
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-grand-total');
    const shippingEl = document.getElementById('cart-shipping');
    const emptyMsg = document.getElementById('cart-empty-message');
    const footer = document.getElementById('cart-drawer-footer');

    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = 'flex';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    if (footer) footer.style.display = 'block';

    let subtotal = 0;
    container.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return `
        <div class="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9]">
          <img src="${item.image}" alt="${item.title}" class="w-14 h-14 rounded-lg object-cover bg-white shrink-0 border border-[#E8E2D9]">
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-[#163A63] truncate">${item.title}</h4>
            <div class="text-[11px] text-[#006494] font-bold mt-0.5">₹${item.price} each</div>
            <div class="flex items-center gap-2 mt-1.5">
              <div class="flex items-center border border-[#E8E2D9] bg-white rounded-md">
                <button class="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-black font-bold text-xs" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                <span class="w-6 text-center text-[11px] font-semibold">${item.quantity}</span>
                <button class="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-black font-bold text-xs" onclick="updateCartQuantity(${item.id}, 1)">+</button>
              </div>
              <button class="text-[11px] text-red-600 hover:underline ml-auto" onclick="removeCartItem(${item.id})">Remove</button>
            </div>
          </div>
          <div class="text-xs font-bold text-[#163A63] self-start">₹${itemTotal}</div>
        </div>
      `;
    }).join('');

    const shipping = subtotal >= 499 ? 0 : 50;
    const grandTotal = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
    if (totalEl) totalEl.textContent = `₹${grandTotal}`;
  }

  window.checkoutCart = window.proceedToCheckout = function () {
    const cart = getCart();
    if (cart.length === 0) {
      window.showToast('Your cart is empty!', 'error');
      return;
    }
    window.closeCartDrawer();
    openCheckoutModal();
  };

  window.clearCart = function () {
    localStorage.removeItem(CART_KEY);
    saveCart([]);
    window.showToast('Cart cleared', 'info');
  };

  function openCheckoutModal() {
    ensureCartDOM();
    let modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  window.closeCheckoutModal = function () {
    let modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  };

  window.processOrder = function (e) {
    if (e) e.preventDefault();
    const name = document.getElementById('checkout-name')?.value || 'Believer';
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
    window.closeCheckoutModal();
    window.showToast(`Thank you, ${name}! Your order has been placed. We will contact you shortly! 🙏`, 'success');
  };

  window.orderViaWhatsApp = function () {
    const cart = getCart();
    if (cart.length === 0) {
      window.showToast('Your cart is empty!', 'error');
      return;
    }
    const itemsList = cart.map(i => `${i.title} (Qty: ${i.quantity}, ₹${i.price * i.quantity})`).join('%0A- ');
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const msg = `Hello DailyBibleFuel, I want to order:%0A- ${itemsList}%0A%0ATotal: ₹${total}`;
    window.open(`https://wa.me/918019777939?text=${msg}`, '_blank');
  };

  // --- 4. MOBILE / TABLET NAVIGATION DRAWER ENGINE ---
  window.toggleMobileSubmenu = function (id) {
    const submenu = typeof id === 'string' ? document.getElementById(id) : id;
    const arrow = typeof id === 'string' ? document.getElementById(id + '-arrow') : null;
    if (submenu) {
      const isHidden = submenu.classList.toggle('hidden');
      if (arrow) {
        arrow.classList.toggle('rotate-180', !isHidden);
      }
    }
  };

  window.openMobileMenu = function () {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const panel = document.getElementById('mobile-drawer-panel') || drawer;

    if (!drawer) return;

    // Show wrapper
    drawer.classList.remove('hidden', 'pointer-events-none');
    drawer.classList.add('pointer-events-auto');

    // Show backdrop
    if (backdrop) {
      backdrop.classList.remove('hidden');
      void backdrop.offsetWidth; // Force CSS reflow
      backdrop.classList.remove('opacity-0');
      backdrop.classList.add('opacity-100');
    }

    // Slide in panel
    if (panel) {
      panel.classList.remove('hidden');
      void panel.offsetWidth; // Force CSS reflow
      panel.classList.remove('translate-x-full');
      panel.classList.add('translate-x-0');
    }

    document.body.style.overflow = 'hidden';
  };

  window.closeMobileMenu = function () {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    const panel = document.getElementById('mobile-drawer-panel') || drawer;

    if (!drawer) return;

    if (backdrop) {
      backdrop.classList.remove('opacity-100');
      backdrop.classList.add('opacity-0');
    }

    if (panel) {
      panel.classList.remove('translate-x-0');
      panel.classList.add('translate-x-full');
    }

    setTimeout(() => {
      if (backdrop) {
        backdrop.classList.add('hidden');
      }
      if (drawer) {
        drawer.classList.remove('pointer-events-auto');
        drawer.classList.add('pointer-events-none');
        if (panel === drawer || !document.getElementById('mobile-drawer-panel')) {
          drawer.classList.add('hidden');
        }
      }
      document.body.style.overflow = '';
    }, 300);
  };

  window.toggleMobileMenu = function () {
    const drawer = document.getElementById('mobile-drawer');
    const panel = document.getElementById('mobile-drawer-panel') || drawer;
    if (panel && panel.classList.contains('translate-x-0') && !panel.classList.contains('translate-x-full')) {
      window.closeMobileMenu();
    } else {
      window.openMobileMenu();
    }
  };

  function initMobileMenu() {
    // 1. All hamburger toggle buttons
    const toggleButtons = document.querySelectorAll(
      '#mobile-menu-btn, #mobile-menu-toggle, .mobile-menu-toggle, [data-mobile-menu-toggle]'
    );
    toggleButtons.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.toggleMobileMenu();
      };
    });

    // 2. All close buttons
    const closeButtons = document.querySelectorAll(
      '#mobile-drawer-close, #mobile-menu-close, .mobile-drawer-close, .mobile-menu-close, [data-mobile-menu-close]'
    );
    closeButtons.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeMobileMenu();
      };
    });

    // 3. Backdrop click closes drawer
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (backdrop) {
      backdrop.onclick = (e) => {
        e.preventDefault();
        window.closeMobileMenu();
      };
    }

    // 4. Submenu accordion toggle buttons
    document.querySelectorAll('.mobile-submenu-toggle').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const submenu = btn.nextElementSibling;
        const arrow = btn.querySelector('.submenu-arrow, .material-symbols-outlined:last-child');
        if (submenu) {
          const isClosed = submenu.classList.contains('hidden');
          submenu.classList.toggle('hidden', !isClosed);
          if (arrow) {
            arrow.classList.toggle('rotate-180', isClosed);
          }
        }
      };
    });

    // 5. Auto-close when clicking links inside drawer
    document.querySelectorAll('#mobile-drawer a, #mobile-drawer-panel a').forEach(link => {
      link.addEventListener('click', () => {
        // Allow time for browser to start navigation before closing visually
        setTimeout(window.closeMobileMenu, 150);
      });
    });

    // 6. Escape key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.closeMobileMenu();
      }
    });

    // 7. Auto close on viewport resize to desktop (width >= 1280px)
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1280) {
        window.closeMobileMenu();
      }
    });
  }

  // Initialization on DOM ready or immediate if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initMobileMenu();
      ensureCartDOM();
      updateCartBadge();
    });
  } else {
    initMobileMenu();
    ensureCartDOM();
    updateCartBadge();
  }
})();
