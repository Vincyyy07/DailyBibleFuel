/**
 * DailyBibleFuel - Dynamic Live Data Synchronizer
 * Automatically reflects all Admin changes (prices, badges, headlines, devotionals, videos, songs)
 * to the public in real-time across all pages.
 */

(function () {
  'use strict';

  let cachedProducts = null;
  let cachedContent = null;
  let cachedWorship = null;

  // Remove any legacy admin bar if present
  const oldBar = document.getElementById('dbfAdminBar');
  if (oldBar) oldBar.remove();

  // 2. Global Content & Helpline Synchronization
  async function syncGlobalSettings(content) {
    if (!content || !content.general) return;
    const g = content.general;

    // Announcement text
    if (g.announcementText) {
      document.querySelectorAll('.announcement-bar-text, [id*="announcementText"]').forEach(el => {
        el.textContent = g.announcementText;
      });
    }

    // Phone numbers & WhatsApp
    if (g.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(el => {
        el.href = `tel:${g.phoneRaw || g.phone.replace(/[^0-9+]/g, '')}`;
        if (el.textContent.includes('+91') || el.classList.contains('site-phone-text')) {
          el.textContent = g.phone;
        }
      });
    }

    if (g.whatsapp) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        try {
          const currentUrl = new URL(el.href);
          const textParam = currentUrl.searchParams.get('text');
          el.href = textParam ? `${g.whatsapp}?text=${encodeURIComponent(textParam)}` : g.whatsapp;
        } catch (_) {
          el.href = g.whatsapp;
        }
      });
    }

    // Email
    if (g.emailPrayer) {
      document.querySelectorAll('a[href*="mailto:hello@"]').forEach(el => {
        el.href = `mailto:${g.emailPrayer}`;
        if (el.textContent.includes('@')) el.textContent = g.emailPrayer;
      });
    }
    if (g.emailGeneral) {
      document.querySelectorAll('a[href*="mailto:info@"]').forEach(el => {
        el.href = `mailto:${g.emailGeneral}`;
        if (el.textContent.includes('@')) el.textContent = g.emailGeneral;
      });
    }
  }

  // 3. Shop Catalog Synchronization (on shop.html)
  async function syncShopCatalog(products) {
    const grid = document.getElementById('productGrid');
    if (!grid || !Array.isArray(products) || products.length === 0) return;

    // Check if products have changed
    const prodSignature = JSON.stringify(products);
    if (grid.dataset.signature === prodSignature) return;
    grid.dataset.signature = prodSignature;

    grid.innerHTML = '';
    products.forEach((p, idx) => {
      const inStock = p.inStock !== false;
      const regPrice = p.price || 50;
      const salePrice = p.salePrice || 30;
      const categorySlug = (p.category || 'Christian Badges').toLowerCase().includes('book') ? 'books' :
                           (p.category || '').toLowerCase().includes('art') ? 'lifestyle' : 'badges';

      const article = document.createElement('article');
      article.className = 'product-card group flex flex-col justify-between bg-parchment-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-border-warm transition-all duration-300';
      article.setAttribute('data-category', categorySlug);
      article.setAttribute('data-id', p.id || idx);
      article.setAttribute('data-lang', 'all');
      article.setAttribute('data-popularity', 100 - idx);
      article.setAttribute('data-price', salePrice);
      article.setAttribute('data-title', p.title);

      const imgUrl = p.image || 'assets/images/logo.png';
      const tag = p.badgeTag || (idx === 0 ? 'Bestseller' : idx === 1 ? 'Popular' : 'Special Edition');

      article.innerHTML = `
        <div class="relative w-full h-56 overflow-hidden bg-slate-50 flex items-center justify-center p-3">
          <span class="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-md font-label-caps text-[10px] tracking-wider uppercase bg-[#D32F2F] text-white shadow-sm font-bold">
            ${tag}
          </span>
          <img class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" alt="${p.title}" src="${imgUrl}" onerror="this.src='assets/images/logo.png'">
          <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#163A63]/85 text-white font-label-caps text-[11px]">
            ${p.category || 'Christian Badge'}
          </div>
        </div>
        <div class="p-5 flex flex-col flex-grow justify-between">
          <div>
            <div class="flex items-center justify-between text-on-surface-variant mb-1">
              <span class="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-bold">${p.category || 'Christian Badges'}</span>
              <div class="flex items-center gap-1 text-gold-accent font-label-caps text-xs">
                <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
                <span class="text-on-surface font-bold">${p.rating || '4.9'}</span>
                <span class="text-outline text-[10px]">(${p.reviewsCount || 24})</span>
              </div>
            </div>
            <h3 class="font-label-lg text-sm text-deep-navy font-bold leading-snug mb-1">
              ${p.title}
            </h3>
            <p class="font-body-sm text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
              ${p.description || 'Authentic faith-inspired Christian badge from DailyBibleFuel.'}
            </p>
          </div>
          <div class="pt-2 border-t border-border-warm/50">
            <div class="flex items-baseline justify-between mb-2">
              <div class="flex items-baseline gap-1.5">
                <span class="font-headline-sm text-lg text-deep-navy font-bold">₹${salePrice}</span>
                ${regPrice > salePrice ? `<span class="font-body-sm text-xs text-outline line-through">₹${regPrice}</span>` : ''}
              </div>
              <span class="font-label-caps text-[11px] ${inStock ? 'text-emerald-700' : 'text-rose-600 font-bold'}">
                ${inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button class="h-10 px-2 bg-deep-navy hover:bg-deep-navy-dark text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm ${!inStock ? 'opacity-60 cursor-not-allowed' : ''}" onclick="${inStock ? `window.addToCart('${p.title.replace(/'/g, "\\'")}', ${salePrice}, '${imgUrl}')` : `window.showToast('Sorry, this badge is currently Out of Stock', 'error')`}">
                <span class="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                <span>Add</span>
              </button>
              <a class="h-10 px-2 bg-surface-container hover:bg-surface-container-high text-deep-navy font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors" href="https://wa.me/918019777939?text=Hi%20DailyBibleFuel%2C%20I%20want%20to%20order%20the%20${encodeURIComponent(p.title)}%20(₹${salePrice})" target="_blank">
                <span class="material-symbols-outlined text-[16px] text-secondary">chat</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      `;
      grid.appendChild(article);
    });

    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.innerText = `Showing ${products.length} products`;
    if (typeof window.filterProducts === 'function') window.filterProducts();
  }

  // 4. Featured Christian Badges on Home Page (index.html)
  async function syncHomeFeaturedBadges(products) {
    const grid = document.getElementById('homeFeaturedBadgesGrid');
    if (!grid || !Array.isArray(products) || products.length === 0) return;

    const featured = products.slice(0, 4);
    const signature = JSON.stringify(featured);
    if (grid.dataset.signature === signature) return;
    grid.dataset.signature = signature;

    grid.innerHTML = '';
    featured.forEach(p => {
      const regPrice = p.price || 50;
      const salePrice = p.salePrice || 30;
      const imgUrl = p.image || 'assets/images/logo.png';
      const inStock = p.inStock !== false;

      const card = document.createElement('div');
      card.className = 'bg-parchment-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-border-warm transition flex flex-col justify-between';
      card.innerHTML = `
        <div class="relative h-48 bg-slate-50 p-3 flex items-center justify-center overflow-hidden">
          <img src="${imgUrl}" alt="${p.title}" class="w-full h-full object-contain hover:scale-105 transition-transform duration-300">
          ${p.badgeTag ? `<span class="absolute top-2 left-2 bg-[#D32F2F] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">${p.badgeTag}</span>` : ''}
        </div>
        <div class="p-4 flex flex-col flex-1 justify-between">
          <div>
            <h4 class="font-bold text-xs text-[#163A63] line-clamp-2 mb-1">${p.title}</h4>
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-base font-bold text-[#D32F2F]">₹${salePrice}</span>
              ${regPrice > salePrice ? `<span class="text-xs text-slate-400 line-through">₹${regPrice}</span>` : ''}
              <span class="text-[10px] ${inStock ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-bold'} ml-auto">${inStock ? 'In Stock' : 'Out of Stock'}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="window.addToCart('${p.title.replace(/'/g, "\\'")}', ${salePrice}, '${imgUrl}')" class="py-2 bg-[#163A63] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition">
              <span class="material-symbols-outlined text-[14px]">add_shopping_cart</span>
              <span>Add</span>
            </button>
            <a href="shop.html?category=badges" class="py-2 bg-slate-100 hover:bg-slate-200 text-[#163A63] text-xs font-semibold rounded-lg text-center transition">
              View
            </a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // 5. Home Page Content Synchronization
  async function syncHomePage(content) {
    if (!content) return;

    if (content.home) {
      const h = content.home;

      const setTxt = (id, val) => {
        if (!val && val !== '') return;
        const el = document.getElementById(id);
        if (el && el.textContent !== val) el.textContent = val;
      };

      const setHref = (id, val) => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el && el.getAttribute('href') !== val) el.setAttribute('href', val);
      };

      const setSrc = (id, val) => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el && !el.src.includes(val)) el.src = val;
      };

      // Hero Elements
      setTxt('homeHeroHeadline', h.heroTitle);
      setTxt('homeHeroSubtitle', h.heroSubtitle);
      setTxt('homeHeroBadge', h.heroBadge);
      setTxt('homeHeroPrimaryBtnText', h.primaryCtaText);
      setHref('homeHeroPrimaryBtn', h.primaryCtaLink);
      setTxt('homeHeroSecondaryBtnText', h.secondaryCtaText);
      setHref('homeHeroSecondaryBtn', h.secondaryCtaLink);
      setTxt('homeHeroStatNumber', h.heroStatNumber);
      setTxt('homeHeroStatText', h.heroStatText);

      // Hero Devotional Card & Audio Texts
      setTxt('homeHeroCardBadge', h.heroCardBadge);
      setTxt('homeHeroCardSubtitle', h.heroCardSubtitle);
      setTxt('homeHeroAudioTitle', h.heroAudioTitle);
      setTxt('homeHeroAudioSubtitle', h.heroAudioSubtitle);

      // Founder's Word & Quote
      setTxt('homeFounderQuote', h.quoteText);
      setTxt('homeFounderName', h.founderName);
      setTxt('homeFounderTitle', h.founderTitle);
      setSrc('homeFounderImage', h.founderImage);

      // Ministry Pathways Header
      setTxt('homePathwaysTag', h.pathwaysTag);
      setTxt('homePathwaysTitle', h.pathwaysTitle);
      setTxt('homePathwaysSubtitle', h.pathwaysSubtitle);

      // Featured Badges Section Header
      setTxt('homeBadgesTag', h.badgesTag);
      setTxt('homeBadgesTitle', h.badgesTitle);
      setTxt('homeBadgesLinkText', h.badgesLinkText);

      // About Sanctuary Section
      setTxt('homeAboutTag', h.aboutTag);
      setTxt('homeAboutTitle', h.aboutTitle);
      setTxt('homeAboutLead', h.aboutLead);
      setTxt('homeAboutDescription', h.aboutDescription);
      setTxt('homeAboutStat1Number', h.aboutStat1Number);
      setTxt('homeAboutStat1Label', h.aboutStat1Label);
      setTxt('homeAboutStat2Number', h.aboutStat2Number);
      setTxt('homeAboutStat2Label', h.aboutStat2Label);
      setSrc('homeAboutImage', h.aboutImage);
      setTxt('homeAboutCtaBtnText', h.aboutCtaText);
      setHref('homeAboutCtaBtn', h.aboutCtaLink);

      // Bottom 24/7 Helpline Banner
      setTxt('homeCtaBannerTag', h.ctaBannerTag);
      setTxt('homeCtaBannerTitle', h.ctaBannerTitle);
      setTxt('homeCtaBannerSubtitle', h.ctaBannerSubtitle);
      setTxt('homeCtaBannerBtn1Text', h.ctaBannerBtn1Text);
      setHref('homeCtaBannerBtn1', h.ctaBannerBtn1Link);
      setTxt('homeCtaBannerBtn2Text', h.ctaBannerBtn2Text);
      setHref('homeCtaBannerBtn2', h.ctaBannerBtn2Link);

      if (h.ctaBannerBgImage) {
        const bgEl = document.getElementById('homeCtaBannerBg');
        if (bgEl && !bgEl.style.backgroundImage.includes(h.ctaBannerBgImage)) {
          bgEl.style.backgroundImage = `url('${h.ctaBannerBgImage}')`;
        }
      }
    }

    if (content.dailyVerse) {
      const vRef = document.getElementById('homeDailyVerseRef');
      if (vRef && content.dailyVerse.reference && vRef.textContent !== content.dailyVerse.reference) {
        vRef.textContent = content.dailyVerse.reference;
      }

      const vText = document.getElementById('homeDailyVerseText');
      if (vText && content.dailyVerse.verseEnglish) {
        const fullQuote = `“${content.dailyVerse.verseEnglish}”`;
        if (vText.textContent !== fullQuote) vText.textContent = fullQuote;
      }
    }
  }

  // 6. Daily Verse Page Synchronization (daily-verse.html)
  async function syncDailyVersePage(content) {
    const refEl = document.getElementById('versePageReference');
    if (!refEl || !content || !content.dailyVerse) return;

    const dv = content.dailyVerse;
    if (dv.reference && refEl.textContent !== dv.reference) refEl.textContent = dv.reference;

    const engEl = document.getElementById('versePageEnglishText');
    if (engEl && dv.verseEnglish && engEl.textContent !== dv.verseEnglish) {
      engEl.textContent = dv.verseEnglish;
    }

    const telEl = document.getElementById('versePageTeluguText');
    if (telEl && dv.verseTelugu && telEl.textContent !== dv.verseTelugu) {
      telEl.textContent = dv.verseTelugu;
    }

    const themeEl = document.getElementById('versePageTheme');
    if (themeEl && dv.theme && themeEl.textContent !== dv.theme) {
      themeEl.textContent = dv.theme;
    }

    const refTextEl = document.getElementById('versePageReflection');
    if (refTextEl && dv.reflection && refTextEl.textContent !== dv.reflection) {
      refTextEl.textContent = dv.reflection;
    }

    const prayerEl = document.getElementById('versePagePrayer');
    if (prayerEl && dv.prayer) {
      const prayerText = `"${dv.prayer}"`;
      if (prayerEl.textContent !== prayerText) prayerEl.textContent = prayerText;
    }
  }

  // 7. Sermons & Videos Page Synchronization (videos-messages.html)
  async function syncVideosPage(content) {
    const grid = document.getElementById('videoGrid');
    if (!grid || !content || !content.videos || !Array.isArray(content.videos.featured)) return;

    const videos = content.videos.featured;
    const signature = JSON.stringify(videos);
    if (grid.dataset.signature === signature) return;
    grid.dataset.signature = signature;

    // Re-render videos dynamically
    grid.innerHTML = '';
    videos.forEach(v => {
      const card = document.createElement('article');
      card.className = 'video-card bg-surface-container-lowest rounded-xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-border-warm flex flex-col justify-between';
      card.setAttribute('data-category', 'sermons');
      card.setAttribute('data-lang', 'all');

      card.innerHTML = `
        <div class="relative h-48 bg-slate-900 overflow-hidden group cursor-pointer" onclick="window.openVideoModal('${(v.title || '').replace(/'/g, "\\'")}', '${(v.speaker || 'DailyBibleFuel').replace(/'/g, "\\'")}', '${(v.series || 'Sermon').replace(/'/g, "\\'")}', 'https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg')">
          <img src="https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg" alt="${v.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div class="w-12 h-12 rounded-full bg-[#D32F2F] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-[28px]">play_arrow</span>
            </div>
          </div>
          <span class="absolute top-3 left-3 px-2 py-0.5 rounded bg-deep-navy/80 text-white text-[10px] font-bold uppercase backdrop-blur-sm">${v.series || 'Sermon'}</span>
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-headline-sm text-base text-deep-navy font-bold mb-1 hover:text-[#D32F2F] transition-colors">
              ${v.title}
            </h3>
            <p class="text-xs text-on-surface-variant line-clamp-2 mb-3">
              ${v.description || 'Spirit-filled message from DailyBibleFuel ministry.'}
            </p>
          </div>
          <div class="pt-3 border-t border-border-warm/60 flex items-center justify-between text-xs text-on-surface-variant">
            <span class="font-semibold text-deep-navy">${v.speaker || 'DailyBibleFuel Team'}</span>
            <span class="text-secondary font-bold">Watch</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    const countEl = document.getElementById('video-count');
    if (countEl) countEl.textContent = videos.length;
  }

  // 8. Worship Songs Synchronization (on english-worship-lyrics.html and telugu-worship-lyrics.html)
  async function syncWorshipPage(worship) {
    if (!worship) return;

    // English Catalog (english-worship-lyrics.html)
    const engGrid = document.getElementById('songCatalogList');
    if (engGrid && Array.isArray(worship.english) && worship.english.length > 0) {
      const signature = JSON.stringify(worship.english);
      if (engGrid.dataset.signature !== signature) {
        engGrid.dataset.signature = signature;
        engGrid.innerHTML = '';
        worship.english.forEach(song => {
          const card = document.createElement('div');
          card.className = 'p-4 rounded-xl bg-surface-container-lowest border border-border-warm hover:border-secondary cursor-pointer transition-all shadow-xs group';
          card.onclick = () => {
            if (typeof window.switchSong === 'function') {
              window.switchSong(song.title, song.artist || 'DailyBibleFuel', 'G', 70);
            }
          };
          card.innerHTML = `
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-sm text-deep-navy group-hover:text-sacred-crimson transition-colors">${song.title}</h4>
              <span class="text-xs px-2 py-0.5 rounded bg-surface-container font-bold text-secondary">Key G</span>
            </div>
            <p class="text-xs text-on-surface-variant mb-2">${song.artist || 'Worship'} • ${song.theme || 'Praise'}</p>
            <div class="flex items-center justify-between text-[11px] text-outline pt-2 border-t border-border-warm/60">
              <span>Tempo: 70 BPM</span>
              <span class="text-secondary font-semibold group-hover:underline">View Sheet →</span>
            </div>
          `;
          engGrid.appendChild(card);
        });
      }
    }

    // Telugu Catalog (telugu-worship-lyrics.html)
    const telGrid = document.getElementById('teluguSongGrid');
    if (telGrid && Array.isArray(worship.telugu) && worship.telugu.length > 0) {
      const telSignature = JSON.stringify(worship.telugu);
      if (telGrid.dataset.signature !== telSignature) {
        telGrid.dataset.signature = telSignature;
        telGrid.innerHTML = '';
        worship.telugu.forEach(song => {
          const card = document.createElement('div');
          card.className = 'tel-song-card p-4 rounded-xl bg-surface-container-lowest border border-border-warm hover:border-secondary cursor-pointer transition-all shadow-xs group';
          card.setAttribute('data-category', 'all');
          const firstChar = song.title ? song.title.trim().charAt(0) : '';
          card.setAttribute('data-letter', firstChar);
          card.onclick = () => {
            if (typeof window.switchTeluguSong === 'function') {
              window.switchTeluguSong(song.title, song.transliteration || '', song.theme || '', 'ఆరాధన గీతము', 'G Maj');
            }
          };
          card.innerHTML = `
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-bold text-sm text-deep-navy group-hover:text-sacred-crimson transition-colors">${song.title}</h4>
              <span class="text-xs px-2 py-0.5 rounded bg-surface-container font-bold text-secondary font-sans">Key G</span>
            </div>
            <p class="text-xs text-on-surface-variant mb-2 font-sans">${song.transliteration || song.title} • ${song.theme || 'ఆరాధన'}</p>
            <div class="flex items-center justify-between text-[11px] text-outline pt-2 border-t border-border-warm/60 font-sans">
              <span>డైలీ బైబిల్ ఫ్యూయల్</span>
              <span class="text-secondary font-semibold group-hover:underline">పాట చూడండి →</span>
            </div>
          `;
          telGrid.appendChild(card);
        });
        const telCountEl = document.getElementById('tel-song-count');
        if (telCountEl) telCountEl.textContent = worship.telugu.length;
      }
    }
  }

  // 9. Main Refresh Dispatcher (fetches latest backend data and updates DOM)
  async function performLiveSync() {
    try {
      // Products
      const prodRes = await fetch('/api/products?t=' + Date.now());
      if (prodRes.ok) {
        const products = await prodRes.json();
        cachedProducts = products;
        syncShopCatalog(products);
        syncHomeFeaturedBadges(products);
      }
    } catch (e) {
      console.warn('Live products sync warning:', e.message);
    }

    try {
      // Site Content
      const contentRes = await fetch('/api/content?t=' + Date.now());
      if (contentRes.ok) {
        const content = await contentRes.json();
        cachedContent = content;
        syncGlobalSettings(content);
        syncHomePage(content);
        syncDailyVersePage(content);
        syncVideosPage(content);
      }
    } catch (e) {
      console.warn('Live content sync warning:', e.message);
    }

    try {
      // Worship Songs (only if on worship pages)
      if (document.getElementById('songCatalogList') || document.getElementById('teluguSongGrid')) {
        const worshipRes = await fetch('/api/worship?t=' + Date.now());
        if (worshipRes.ok) {
          const worship = await worshipRes.json();
          cachedWorship = worship;
          syncWorshipPage(worship);
        }
      }
    } catch (e) {
      console.warn('Live worship sync warning:', e.message);
    }
  }

  // 10. Auto-sync Interval & Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    performLiveSync();

    // Poll every 8 seconds for instant public updates
    setInterval(performLiveSync, 8000);

    // Also sync immediately when user switches tabs or window gains focus
    window.addEventListener('focus', performLiveSync);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        performLiveSync();
      }
    });
  });

})();
