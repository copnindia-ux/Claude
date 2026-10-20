/* ==========================================================================
   Barcelona — theme scripts (vanilla JS, custom elements)
   ========================================================================== */
(() => {
  'use strict';

  const theme = window.theme || {};
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  };

  const parseHTML = (text) => new DOMParser().parseFromString(text, 'text/html');

  const fetchJSON = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) }
    });
    const data = await res.json();
    if (!res.ok || data.status) {
      const err = new Error(data.description || data.message || theme.strings?.cartError || 'Error');
      err.data = data;
      throw err;
    }
    return data;
  };

  const toast = (message) => {
    const el = qs('[data-toast]');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.hidden = true), 3000);
  };

  const formatMoney = (cents, format = theme.moneyFormat || '${{amount}}') => {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    const value = Number(cents);
    const fmt = (n, decimals, thousands = ',', decimal = '.') => {
      const fixed = (n / 100).toFixed(decimals);
      const [int, dec] = fixed.split('.');
      return int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (dec ? decimal + dec : '');
    };
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      switch (key) {
        case 'amount_no_decimals': return fmt(value, 0);
        case 'amount_with_comma_separator': return fmt(value, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator': return fmt(value, 0, '.');
        case 'amount_with_apostrophe_separator': return fmt(value, 2, "'");
        default: return fmt(value, 2);
      }
    });
  };

  /* ---------- Focus trap ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';
  let trapHandler = null;
  const trapFocus = (container) => {
    removeTrapFocus();
    trapHandler = (e) => {
      if (e.key !== 'Tab') return;
      const els = qsa(FOCUSABLE, container).filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trapHandler);
  };
  const removeTrapFocus = () => {
    if (trapHandler) document.removeEventListener('keydown', trapHandler);
    trapHandler = null;
  };

  /* ==========================================================================
     Overlay base: drawers + modals
     ========================================================================== */
  class OverlayElement extends HTMLElement {
    connectedCallback() {
      if (this._bound) return;
      this._bound = true;
      this.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) this.close();
      });
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    }
    get panel() { return qs('.drawer__panel, .modal__panel', this); }
    open(opener) {
      this._opener = opener || document.activeElement;
      this.classList.add('is-open');
      this.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
      if (this._opener && this._opener.setAttribute) this._opener.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => {
        (this.focusTarget || this.panel)?.focus({ preventScroll: true });
        trapFocus(this);
      });
      this.dispatchEvent(new CustomEvent('overlay:open', { bubbles: true }));
    }
    close() {
      if (!this.classList.contains('is-open')) return;
      this.classList.remove('is-open');
      this.setAttribute('aria-hidden', 'true');
      if (!qs('.drawer.is-open, .modal.is-open')) document.body.classList.remove('overflow-hidden');
      removeTrapFocus();
      if (this._opener && this._opener.setAttribute) {
        this._opener.setAttribute('aria-expanded', 'false');
        this._opener.focus?.({ preventScroll: true });
      }
      this.dispatchEvent(new CustomEvent('overlay:close', { bubbles: true }));
    }
  }

  class MenuDrawer extends OverlayElement {}
  class FacetsDrawer extends OverlayElement {}
  class ModalDialog extends OverlayElement {}
  class LightboxModal extends OverlayElement {
    show(index) {
      this.open();
      const img = qs(`[data-lightbox-index="${index}"]`, this);
      if (img) requestAnimationFrame(() => img.scrollIntoView({ block: 'start' }));
    }
  }

  customElements.define('menu-drawer', MenuDrawer);
  customElements.define('facets-drawer', FacetsDrawer);
  customElements.define('modal-dialog', ModalDialog);
  customElements.define('lightbox-modal', LightboxModal);

  /* Global openers */
  document.addEventListener('click', (e) => {
    const drawerOpener = e.target.closest('[data-drawer-open]');
    if (drawerOpener) {
      const el = document.getElementById(drawerOpener.dataset.drawerOpen);
      if (el && el.open) { e.preventDefault(); el.open(drawerOpener); }
      return;
    }
    const modalOpener = e.target.closest('[data-modal-open]');
    if (modalOpener) {
      const el = document.getElementById(modalOpener.dataset.modalOpen);
      if (el && el.open) { e.preventDefault(); el.open(modalOpener); }
      return;
    }
    const searchOpener = e.target.closest('[data-search-open]');
    if (searchOpener) {
      const el = document.getElementById('SearchModal');
      const parent = searchOpener.closest('.drawer.is-open, .modal.is-open');
      if (parent && parent !== el && parent.close) parent.close();
      if (el) { e.preventDefault(); el.open(searchOpener); }
      return;
    }
    const cartOpener = e.target.closest('[data-cart-open]');
    if (cartOpener && theme.cartType === 'drawer') {
      const el = document.getElementById('CartDrawer');
      if (el) { e.preventDefault(); el.open(cartOpener); }
    }
  });

  /* ==========================================================================
     Cart
     ========================================================================== */
  const Cart = {
    sections() {
      const ids = ['cart-icon-bubble'];
      if (document.getElementById('CartDrawer')) ids.push('cart-drawer');
      const page = qs('cart-page');
      if (page) ids.push(page.dataset.section);
      return ids;
    },

    async add(formData) {
      formData.append('sections', this.sections().join(','));
      formData.append('sections_url', window.location.pathname);
      const res = await fetch(`${theme.routes.cartAdd}.js`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || data.status) {
        const err = new Error(data.description || data.message || theme.strings.cartError);
        throw err;
      }
      this.render(data.sections);
      document.dispatchEvent(new CustomEvent('cart:added', { detail: data }));
      return data;
    },

    async change(line, quantity) {
      const data = await fetchJSON(`${theme.routes.cartChange}.js`, {
        method: 'POST',
        body: JSON.stringify({ line, quantity, sections: this.sections(), sections_url: window.location.pathname })
      });
      this.render(data.sections);
      document.dispatchEvent(new CustomEvent('cart:changed', { detail: data }));
      return data;
    },

    async updateNote(note) {
      await fetchJSON(`${theme.routes.cartUpdate}.js`, { method: 'POST', body: JSON.stringify({ note }) });
    },

    async refresh() {
      const res = await fetch(`${window.location.pathname}?sections=${this.sections().join(',')}`);
      this.render(await res.json());
    },

    render(sections) {
      if (!sections) return;
      // Header count
      if (sections['cart-icon-bubble']) {
        const doc = parseHTML(sections['cart-icon-bubble']);
        const countEl = qs('[data-cart-count]', doc);
        const count = countEl ? countEl.textContent.trim() : '0';
        const isEmpty = countEl ? countEl.hasAttribute('hidden') : true;
        qsa('[data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = isEmpty; });
        qsa('[data-cart-count-text]').forEach((el) => { el.textContent = isEmpty ? '0' : count; });
      }
      // Drawer
      if (sections['cart-drawer']) {
        const doc = parseHTML(sections['cart-drawer']);
        const fresh = qs('#CartDrawer-inner', doc);
        const current = document.getElementById('CartDrawer-inner');
        if (fresh && current) {
          const scroll = qs('.drawer__body', current)?.scrollTop || 0;
          current.innerHTML = fresh.innerHTML;
          const body = qs('.drawer__body', current);
          if (body) body.scrollTop = scroll;
        }
      }
      // Cart page
      const page = qs('cart-page');
      if (page && sections[page.dataset.section]) {
        const doc = parseHTML(sections[page.dataset.section]);
        const fresh = qs('cart-page', doc);
        if (fresh) page.innerHTML = fresh.innerHTML;
      }
    }
  };
  window.BarcelonaCart = Cart;
  window.Barcelona = { OverlayElement, Cart, toast, formatMoney };

  class CartDrawer extends OverlayElement {}
  customElements.define('cart-drawer', CartDrawer);
  class CartPage extends HTMLElement {}
  customElements.define('cart-page', CartPage);

  // Line item quantity / remove (delegated, works after re-render)
  const changeLine = async (line, quantity, itemEl) => {
    itemEl?.classList.add('is-loading');
    try {
      await Cart.change(Number(line), Number(quantity));
    } catch (err) {
      itemEl?.classList.remove('is-loading');
      const errorEl = itemEl && qs('[data-line-error]', itemEl);
      if (errorEl) { errorEl.textContent = err.message; errorEl.hidden = false; }
      else toast(err.message);
    }
  };

  document.addEventListener('change', (e) => {
    const input = e.target.closest('[data-cart-quantity]');
    if (input) {
      changeLine(input.dataset.line, input.value, input.closest('[data-cart-item]'));
      return;
    }
    const note = e.target.closest('[data-cart-note]');
    if (note) Cart.updateNote(note.value).catch(() => {});

    const autosubmit = e.target.closest('[data-autosubmit]');
    if (autosubmit) autosubmit.form.submit();
  });

  document.addEventListener('click', (e) => {
    const remove = e.target.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      changeLine(remove.dataset.cartRemove, 0, remove.closest('[data-cart-item]'));
    }
  });

  // Add to cart for every product form
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-product-form]');
    if (!form) return;
    if (theme.cartType !== 'drawer' && !qs('cart-page')) return; // fall back to native submit -> /cart
    e.preventDefault();

    const button = qs('[type="submit"]', form);
    const errorEl = form.closest('product-form') ? qs('[data-form-error]', form.closest('product-form')) : null;
    if (errorEl) errorEl.hidden = true;
    if (button) { button.classList.add('loading'); button.setAttribute('aria-disabled', 'true'); }

    try {
      await Cart.add(new FormData(form));
      const quickView = document.getElementById('QuickView');
      if (quickView && quickView.contains(form)) quickView.close();
      if (form.closest('[data-no-drawer]')) {
        toast(theme.strings.added || theme.strings.addToCart);
        return;
      }
      const drawer = document.getElementById('CartDrawer');
      if (drawer && theme.cartType === 'drawer') drawer.open(button);
    } catch (err) {
      if (errorEl) { errorEl.textContent = err.message; errorEl.hidden = false; }
      else toast(err.message);
    } finally {
      if (button) { button.classList.remove('loading'); button.removeAttribute('aria-disabled'); }
    }
  });

  // Keep cart in sync when returning via back/forward cache
  window.addEventListener('pageshow', (e) => { if (e.persisted) Cart.refresh().catch(() => {}); });

  /* ==========================================================================
     Quantity input
     ========================================================================== */
  class QuantityInput extends HTMLElement {
    connectedCallback() {
      if (this._bound) return;
      this._bound = true;
      this.input = qs('input', this);
      qsa('button', this).forEach((btn) =>
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const step = Number(this.input.step) || 1;
          const min = Number(this.input.min) || 0;
          const max = this.input.max ? Number(this.input.max) : Infinity;
          const prev = Number(this.input.value) || 0;
          const next = btn.name === 'plus' ? Math.min(prev + step, max) : Math.max(prev - step, min);
          if (next === prev) return;
          this.input.value = next;
          this.input.dispatchEvent(new Event('change', { bubbles: true }));
        })
      );
    }
  }
  customElements.define('quantity-input', QuantityInput);

  /* ==========================================================================
     Announcement bar
     ========================================================================== */
  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.slides = qsa('.announcement-bar__slide', this);
      if (this.slides.length < 2) return;
      this.index = 0;
      qs('[data-prev]', this)?.addEventListener('click', () => { this.go(-1); this.restart(); });
      qs('[data-next]', this)?.addEventListener('click', () => { this.go(1); this.restart(); });
      this.addEventListener('mouseenter', () => this.stop());
      this.addEventListener('mouseleave', () => this.start());
      this.addEventListener('focusin', () => this.stop());
      this.start();
    }
    disconnectedCallback() { this.stop(); }
    go(dir) {
      this.slides[this.index].classList.remove('is-active');
      this.index = (this.index + dir + this.slides.length) % this.slides.length;
      this.slides[this.index].classList.add('is-active');
    }
    start() {
      if (this.dataset.autoplay !== 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.stop();
      this.timer = setInterval(() => this.go(1), Number(this.dataset.speed) || 5000);
    }
    stop() { clearInterval(this.timer); }
    restart() { this.stop(); this.start(); }
    select(el) {
      const i = this.slides.indexOf(el);
      if (i < 0) return;
      this.stop();
      this.slides[this.index].classList.remove('is-active');
      this.index = i;
      el.classList.add('is-active');
    }
  }
  customElements.define('announcement-bar', AnnouncementBar);

  /* ==========================================================================
     Sticky header + navigation
     ========================================================================== */
  class StickyHeader extends HTMLElement {
    connectedCallback() {
      this.header = qs('.site-header', this);
      this.mode = this.dataset.sticky;
      this.lastY = window.scrollY;
      this.setHeight();
      this.onScroll = this.onScroll.bind(this);
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', debounce(() => this.setHeight(), 150));
      this.onScroll();
      this.initNav();
    }
    disconnectedCallback() { window.removeEventListener('scroll', this.onScroll); }
    setHeight() {
      document.documentElement.style.setProperty('--header-height', `${this.offsetHeight}px`);
    }
    onScroll() {
      const y = window.scrollY;
      this.header.classList.toggle('is-scrolled', y > 10);
      if (this.mode === 'scroll-up') {
        const hide = y > this.lastY && y > this.offsetHeight + 50;
        if (!qs('.nav-item.is-open', this)) this.header.classList.toggle('is-hidden', hide);
      }
      this.lastY = y;
    }
    initNav() {
      const items = qsa('[data-nav-item]', this);
      const isDesktopHover = () => window.matchMedia('(hover: hover) and (min-width: 990px)').matches;
      const closeAll = (except) => items.forEach((it) => {
        if (it === except) return;
        it.classList.remove('is-open');
        qs('.nav-link', it)?.setAttribute('aria-expanded', 'false');
      });
      items.forEach((item) => {
        const trigger = qs('.nav-link', item);
        const openItem = () => { closeAll(item); item.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); };
        const closeItem = () => { item.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); };
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          item.classList.contains('is-open') ? closeItem() : openItem();
        });
        item.addEventListener('mouseenter', () => { if (isDesktopHover()) { clearTimeout(item._t); openItem(); } });
        item.addEventListener('mouseleave', () => { if (isDesktopHover()) item._t = setTimeout(closeItem, 120); });
        item.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeItem(); trigger.focus(); } });
        item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) closeItem(); });
      });
      document.addEventListener('click', (e) => { if (!this.contains(e.target)) closeAll(); });
    }
  }
  customElements.define('sticky-header', StickyHeader);

  /* ==========================================================================
     Predictive search
     ========================================================================== */
  class SearchModal extends OverlayElement {
    connectedCallback() {
      super.connectedCallback();
      this.input = qs('input[type="search"]', this);
      this.focusTarget = this.input;
      this.results = qs('[data-search-results]', this);
      this.defaults = qs('[data-search-default]', this);
      if (this.input && this.input.hasAttribute('data-predictive')) {
        this.input.addEventListener('input', debounce(() => this.search(), 250));
      }
    }
    async search() {
      const term = this.input.value.trim();
      if (this.abort) this.abort.abort();
      if (!term) {
        this.results.innerHTML = '';
        if (this.defaults) this.defaults.hidden = false;
        this.input.setAttribute('aria-expanded', 'false');
        return;
      }
      this.abort = new AbortController();
      const params = new URLSearchParams({
        q: term,
        section_id: 'predictive-search',
        'resources[type]': 'product,collection,page,article,query',
        'resources[limit]': '4',
        'resources[options][unavailable_products]': 'last',
        'resources[options][fields]': 'title,product_type,variants.title,vendor,tag'
      });
      try {
        const res = await fetch(`${theme.routes.predictiveSearch}?${params}`, { signal: this.abort.signal });
        if (!res.ok) throw new Error(res.status);
        const doc = parseHTML(await res.text());
        const section = qs('#shopify-section-predictive-search', doc) || doc.body;
        this.results.innerHTML = section.innerHTML;
        if (this.defaults) this.defaults.hidden = true;
        this.input.setAttribute('aria-expanded', 'true');
      } catch (err) {
        if (err.name !== 'AbortError') this.results.innerHTML = '';
      }
    }
  }
  customElements.define('search-modal', SearchModal);

  /* ==========================================================================
     Quick view
     ========================================================================== */
  class QuickViewModal extends OverlayElement {
    connectedCallback() {
      super.connectedCallback();
      this.content = qs('[data-quick-view-content]', this);
    }
    async load(url, opener) {
      this.content.innerHTML = '<div class="loading-spinner" role="status"></div>';
      this.open(opener);
      try {
        const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}section_id=quick-view`);
        const doc = parseHTML(await res.text());
        const section = qs('#shopify-section-quick-view', doc) || doc.body;
        this.content.innerHTML = section.innerHTML;
        if (window.Shopify && Shopify.PaymentButton) Shopify.PaymentButton.init();
      } catch (e) {
        window.location.href = url;
      }
    }
    close() {
      super.close();
      setTimeout(() => { if (!this.classList.contains('is-open')) this.content.innerHTML = ''; }, 300);
    }
  }
  customElements.define('quick-view-modal', QuickViewModal);

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-quick-view]');
    if (!trigger) return;
    e.preventDefault();
    const modal = document.getElementById('QuickView');
    if (modal) modal.load(trigger.dataset.quickView, trigger);
    else window.location.href = trigger.dataset.quickView;
  });

  /* Card swatches: swap card image */
  document.addEventListener('click', (e) => {
    const swatch = e.target.closest('[data-product-card] .swatch');
    if (!swatch) return;
    e.preventDefault();
    const card = swatch.closest('[data-product-card]');
    qsa('.swatch', card).forEach((s) => s.classList.toggle('is-active', s === swatch));
    const img = qs('.card__image--primary', card);
    if (img && swatch.dataset.swatchImage) {
      img.src = swatch.dataset.swatchImage;
      img.srcset = swatch.dataset.swatchSrcset || '';
    }
    const link = qs('[data-card-link]', card);
    if (link && swatch.dataset.swatchUrl) link.href = swatch.dataset.swatchUrl;
  });

  /* ==========================================================================
     Product: media gallery
     ========================================================================== */
  class MediaGallery extends HTMLElement {
    connectedCallback() {
      this.list = qs('[data-media-list]', this);
      this.items = qsa('.product__media-item', this);
      this.dots = qsa('[data-dot]', this);
      this.thumbs = qsa('[data-thumb]', this);

      this.dots.forEach((dot) => dot.addEventListener('click', () => this.scrollToIndex(Number(dot.dataset.dot))));
      this.thumbs.forEach((thumb) => thumb.addEventListener('click', () => this.setActiveMedia(thumb.dataset.thumb)));

      if (this.list && this.items.length > 1) {
        this.list.addEventListener('scroll', debounce(() => this.syncFromScroll(), 60), { passive: true });
      }

      qsa('[data-zoom]', this).forEach((btn) =>
        btn.addEventListener('click', () => {
          const lb = qs('lightbox-modal', this);
          if (lb) lb.show(btn.dataset.zoom);
        })
      );
    }
    isHorizontal() {
      return this.list && this.list.scrollWidth > this.list.clientWidth + 2;
    }
    scrollToIndex(i) {
      const item = this.items[i];
      if (!item) return;
      if (this.isHorizontal()) this.list.scrollTo({ left: item.offsetLeft - this.list.offsetLeft, behavior: 'smooth' });
      else item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.markActive(i);
    }
    setActiveMedia(mediaId) {
      const i = this.items.findIndex((it) => it.dataset.mediaId === String(mediaId));
      if (i < 0) return;
      if (this.isHorizontal()) {
        this.scrollToIndex(i);
      } else if (this.list.classList.contains('product__media-list--grid') || this.list.classList.contains('product__media-list--stack')) {
        // Desktop grid: move the variant image to the first slot
        const item = this.items[i];
        if (item !== this.list.firstElementChild) {
          this.list.prepend(item);
          this.items = qsa('.product__media-item', this);
        }
        if (this.getBoundingClientRect().top < 0) window.scrollTo({ top: window.scrollY + this.getBoundingClientRect().top - 100, behavior: 'smooth' });
      }
      this.markActive(i);
    }
    syncFromScroll() {
      if (!this.isHorizontal()) return;
      const x = this.list.scrollLeft;
      const w = this.list.clientWidth;
      this.markActive(Math.round(x / w));
    }
    markActive(i) {
      this.dots.forEach((d, idx) => d.setAttribute('aria-current', String(idx === i)));
      const id = this.items[i]?.dataset.mediaId;
      this.thumbs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.thumb === id)));
      const activeThumb = this.thumbs.find((t) => t.dataset.thumb === id);
      activeThumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
  customElements.define('media-gallery', MediaGallery);

  /* ==========================================================================
     Product: variant picker
     ========================================================================== */
  class VariantPicker extends HTMLElement {
    connectedCallback() {
      this.sectionId = this.dataset.section;
      this.productUrl = this.dataset.url;
      try {
        this.variants = JSON.parse(qs('[data-variants]', this).textContent);
      } catch (e) {
        this.variants = [];
      }
      this.addEventListener('change', () => this.onChange());
      this.updateAvailability();
    }
    get selectedOptions() {
      const groups = new Map();
      qsa('input[type="radio"]:checked, select', this).forEach((el) => {
        groups.set(Number(el.dataset.optionIndex), el.value);
      });
      return Array.from(groups.keys()).sort((a, b) => a - b).map((k) => groups.get(k));
    }
    get root() {
      return this.closest('[data-section], .modal__content, section') || document;
    }
    onChange() {
      const options = this.selectedOptions;
      const variant = this.variants.find((v) => v.options.every((o, i) => o === options[i]));
      qsa('fieldset', this).forEach((fs) => {
        const checked = qs('input:checked', fs);
        const label = qs('[data-selected-value]', fs);
        if (checked && label) label.textContent = checked.value;
      });
      this.updateAvailability();
      this.currentVariant = variant;

      const root = this.root;
      const forms = qsa(`product-form[data-section="${this.sectionId}"]`, document);
      forms.forEach((pf) => {
        const idInput = qs('[data-variant-id]', pf);
        const button = qs('[data-add-button]', pf);
        const label = qs('[data-add-label]', pf);
        if (!variant) {
          if (idInput) idInput.disabled = true;
          if (button) button.disabled = true;
          if (label) label.textContent = theme.strings.unavailable;
          return;
        }
        if (idInput) { idInput.value = variant.id; idInput.disabled = !variant.available; }
        if (button) button.disabled = !variant.available;
        if (label) label.textContent = variant.available ? `${theme.strings.addToCart} · ${formatMoney(variant.price)}` : theme.strings.soldOut;
      });

      // Sticky add-to-cart bar (main product only)
      const sticky = qs(`sticky-atc[data-section="${this.sectionId}"]`);
      if (sticky && variant) {
        const label = qs('[data-add-label]', sticky);
        const btn = qs('[data-sticky-add]', sticky);
        const title = qs('[data-sticky-variant]', sticky);
        if (label) label.textContent = variant.available ? `${theme.strings.addToCart} · ${formatMoney(variant.price)}` : theme.strings.soldOut;
        if (btn) btn.disabled = !variant.available;
        if (title) title.textContent = variant.title;
      }

      if (!variant) return;

      if (variant.featured_media) {
        const gallery = document.getElementById(`MediaGallery-${this.sectionId}`);
        gallery?.setActiveMedia(variant.featured_media.id);
      }

      // Update URL for the main product page
      if (this.closest('.section-main-product') || this.closest('[id^="MainProduct-"]')) {
        window.history.replaceState({}, '', `${this.productUrl}?variant=${variant.id}`);
      }

      this.updatePrice(variant);
      // Server-rendered blocks (inventory, SKU, pickup) can only be fetched where the
      // section exists on the product template, or for the quick view section.
      if (this.sectionId === 'quick-view' || this.closest('[id^="MainProduct-"]')) this.renderDynamic(variant, root);
      document.dispatchEvent(new CustomEvent('variant:change', { detail: { variant, sectionId: this.sectionId } }));
    }
    updatePrice(variant) {
      const wrap = document.getElementById(`Price-${this.sectionId}`);
      if (!wrap) return;
      const onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
      const current = qs('.price__current', wrap);
      if (current) current.textContent = formatMoney(variant.price);
      let compare = qs('.price__compare', wrap);
      if (onSale) {
        if (!compare) {
          compare = document.createElement('s');
          compare.className = 'price__compare';
          current?.after(compare);
        }
        compare.textContent = formatMoney(variant.compare_at_price);
      } else if (compare) {
        compare.remove();
      }
    }
    async renderDynamic(variant) {
      if (this.abort) this.abort.abort();
      this.abort = new AbortController();
      const sectionParam = this.sectionId;
      try {
        const res = await fetch(`${this.productUrl}?variant=${variant.id}&section_id=${encodeURIComponent(sectionParam)}`, { signal: this.abort.signal });
        const doc = parseHTML(await res.text());
        ['Price', 'Inventory', 'Sku', 'Pickup'].forEach((prefix) => {
          const id = `${prefix}-${this.sectionId}`;
          const current = document.getElementById(id);
          const fresh = doc.getElementById(id);
          if (current && fresh) current.innerHTML = fresh.innerHTML;
        });
      } catch (e) { /* aborted or offline */ }
    }
    updateAvailability() {
      const selected = this.selectedOptions;
      qsa('input[type="radio"]', this).forEach((input) => {
        const idx = Number(input.dataset.optionIndex);
        const available = this.variants.some((v) =>
          v.available && v.options[idx] === input.value && v.options.every((o, i) => i === idx || i > idx || o === selected[i])
        );
        input.classList.toggle('is-disabled', !available);
      });
    }
  }
  customElements.define('variant-picker', VariantPicker);

  class ProductForm extends HTMLElement {}
  customElements.define('product-form', ProductForm);

  /* Sticky add to cart */
  class StickyAtc extends HTMLElement {
    connectedCallback() {
      const sectionId = this.dataset.section;
      const mainForm = qs(`product-form[data-section="${sectionId}"]`);
      if (!mainForm) return;
      const target = qs('[data-add-button]', mainForm);
      const footer = qs('.site-footer');
      let atcVisible = true;
      let footerVisible = false;
      const update = () => {
        const show = !atcVisible && !footerVisible;
        this.classList.toggle('is-visible', show);
        this.setAttribute('aria-hidden', String(!show));
      };
      new IntersectionObserver(([entry]) => {
        atcVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
        update();
      }).observe(target);
      if (footer) new IntersectionObserver(([entry]) => { footerVisible = entry.isIntersecting; update(); }).observe(footer);

      qs('[data-sticky-add]', this)?.addEventListener('click', () => {
        const form = qs('form', mainForm);
        if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
    }
  }
  customElements.define('sticky-atc', StickyAtc);

  /* Product recommendations (related & complementary) */
  class ProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (this._loaded) return;
      const load = async () => {
        this._loaded = true;
        try {
          const res = await fetch(this.dataset.url);
          const doc = parseHTML(await res.text());
          const fresh = doc.getElementById(this.dataset.target);
          const current = document.getElementById(this.dataset.target);
          if (fresh && current && fresh.innerHTML.trim()) current.innerHTML = fresh.innerHTML;
        } catch (e) { /* ignore */ }
      };
      new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        load();
      }, { rootMargin: '0px 0px 400px 0px' }).observe(this);
    }
  }
  customElements.define('product-recommendations', ProductRecommendations);

  /* Share */
  class ShareButton extends HTMLElement {
    connectedCallback() {
      const btn = qs('button', this);
      btn?.addEventListener('click', async () => {
        const url = btn.dataset.shareUrl || window.location.href;
        if (navigator.share) {
          try { await navigator.share({ url, title: btn.dataset.shareTitle || document.title }); } catch (e) { /* cancelled */ }
        } else {
          await navigator.clipboard.writeText(url);
          toast(theme.strings.copied);
        }
      });
    }
  }
  customElements.define('share-button', ShareButton);

  class PickupAvailability extends HTMLElement {}
  customElements.define('pickup-availability', PickupAvailability);

  /* ==========================================================================
     Slider (carousels, slideshow, tabs)
     ========================================================================== */
  class SliderComponent extends HTMLElement {
    connectedCallback() {
      this.initTabs();
      this.initSlider();
    }
    disconnectedCallback() { clearInterval(this.timer); }
    get slider() {
      return qsa('[data-slider]', this).find((s) => s.offsetParent !== null) || qs('[data-slider]', this);
    }
    initSlider() {
      const prev = qs('[data-slider-prev]', this);
      const next = qs('[data-slider-next]', this);
      const dotsWrap = qs('[data-slider-dots]', this);
      const progress = qs('[data-slider-progress]', this);

      const slides = () => Array.from(this.slider?.children || []);
      const step = () => {
        const s = slides();
        if (s.length < 2) return this.slider.clientWidth;
        return s[1].offsetLeft - s[0].offsetLeft;
      };
      const update = () => {
        const sl = this.slider;
        if (!sl) return;
        const max = sl.scrollWidth - sl.clientWidth;
        if (prev) prev.disabled = sl.scrollLeft <= 2;
        if (next) next.disabled = sl.scrollLeft >= max - 2;
        if (progress) {
          const ratio = sl.clientWidth / sl.scrollWidth;
          progress.style.width = `${ratio * 100}%`;
          progress.style.left = `${(max > 0 ? sl.scrollLeft / max : 0) * (100 - ratio * 100)}%`;
        }
        if (dotsWrap) {
          const i = Math.round(sl.scrollLeft / (step() || 1));
          qsa('.slider-dot', dotsWrap).forEach((d, idx) => d.setAttribute('aria-current', String(idx === i)));
        }
      };
      this.goTo = (i) => {
        const s = slides();
        if (!s[i]) return;
        this.slider.scrollTo({ left: s[i].offsetLeft - this.slider.offsetLeft, behavior: 'smooth' });
      };
      prev?.addEventListener('click', () => this.slider.scrollBy({ left: -step(), behavior: 'smooth' }));
      next?.addEventListener('click', () => this.slider.scrollBy({ left: step(), behavior: 'smooth' }));

      if (dotsWrap) {
        dotsWrap.innerHTML = '';
        slides().forEach((_, i) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'slider-dot';
          dot.setAttribute('aria-label', `${i + 1} / ${slides().length}`);
          dot.addEventListener('click', () => { this.goTo(i); this.restart(); });
          dotsWrap.appendChild(dot);
        });
      }

      qsa('[data-slider]', this).forEach((sl) => sl.addEventListener('scroll', debounce(update, 50), { passive: true }));
      window.addEventListener('resize', debounce(update, 150));
      update();

      // Autoplay (slideshow)
      if (this.dataset.autoplay === 'true' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.speed = Number(this.dataset.speed) || 6000;
        this.restart = () => {
          clearInterval(this.timer);
          this.timer = setInterval(() => {
            const sl = this.slider;
            const atEnd = sl.scrollLeft >= sl.scrollWidth - sl.clientWidth - 2;
            if (atEnd) sl.scrollTo({ left: 0, behavior: 'smooth' });
            else sl.scrollBy({ left: step(), behavior: 'smooth' });
          }, this.speed);
        };
        this.addEventListener('mouseenter', () => clearInterval(this.timer));
        this.addEventListener('mouseleave', () => this.restart());
        this.addEventListener('focusin', () => clearInterval(this.timer));
        this.restart();
      } else {
        this.restart = () => {};
      }
      this._update = update;
    }
    initTabs() {
      const tabs = qsa('[data-tab]', this);
      if (!tabs.length) return;
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => this.selectTab(tab));
        tab.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          const i = tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1);
          const nextTab = tabs[(i + tabs.length) % tabs.length];
          nextTab.focus();
          this.selectTab(nextTab);
        });
      });
    }
    selectTab(tab) {
      qsa('[data-tab]', this).forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      qsa('[data-tab-panel]', this).forEach((p) => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
      if (this._update) requestAnimationFrame(this._update);
    }
  }
  customElements.define('slider-component', SliderComponent);

  /* ==========================================================================
     Collection filters, sorting, load more
     ========================================================================== */
  class FacetFilters extends HTMLElement {
    connectedCallback() {
      this.sectionId = this.dataset.section;
      this.onChange = debounce(this.onChange.bind(this), 400);
      this.addEventListener('change', (e) => {
        if (e.target.closest('[data-facets-form]')) this.onChange(e.target.closest('form'));
        if (e.target.matches('[data-sort]')) this.onSort(e.target.value);
      });
      this.addEventListener('input', (e) => {
        if (e.target.closest('.facet__price')) this.onChange(e.target.closest('form'));
      });
      this.addEventListener('click', (e) => {
        const remove = e.target.closest('[data-facet-remove]');
        if (remove) {
          e.preventDefault();
          this.render(new URL(remove.href, window.location.origin).searchParams.toString());
          return;
        }
        const loadMore = e.target.closest('[data-load-more-link]');
        if (loadMore) {
          e.preventDefault();
          this.loadMore(loadMore);
        }
      });
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.facets !== undefined) this.render(e.state.facets, false);
      });
    }
    paramsFromForm(form) {
      const params = new URLSearchParams(new FormData(form));
      for (const [key, value] of Array.from(params.entries())) {
        if (value === '') params.delete(key);
      }
      const sort = qs('[data-sort]', this);
      if (sort) params.set('sort_by', sort.value);
      return params.toString();
    }
    onChange(form) {
      this.render(this.paramsFromForm(form));
    }
    onSort(value) {
      const params = new URLSearchParams(window.location.search);
      params.set('sort_by', value);
      params.delete('page');
      this.render(params.toString());
    }
    async render(searchParams, updateHistory = true) {
      const grid = qs('[data-product-grid]', this);
      grid?.classList.add('is-loading');
      const params = new URLSearchParams(searchParams);
      params.set('section_id', this.sectionId);
      try {
        const res = await fetch(`${window.location.pathname}?${params}`);
        const doc = parseHTML(await res.text());
        ['ProductGrid', 'ActiveFacets', 'FacetsDrawerBody', 'FacetsSidebar', 'ProductCount'].forEach((prefix) => {
          const id = `${prefix}-${this.sectionId}`;
          const current = document.getElementById(id);
          const fresh = doc.getElementById(id);
          if (!current || !fresh) return;
          if (prefix === 'FacetsDrawerBody' || prefix === 'FacetsSidebar') {
            // Preserve open/closed state of filter groups
            const openState = qsa('details', current).map((d) => d.open);
            current.innerHTML = fresh.innerHTML;
            qsa('details', current).forEach((d, i) => { if (openState[i] !== undefined) d.open = openState[i]; });
          } else {
            current.innerHTML = fresh.innerHTML;
          }
        });
        const freshCount = qs('[data-product-count]', doc);
        const currentCount = qs('[data-product-count]', this);
        if (freshCount && currentCount) currentCount.textContent = freshCount.textContent;
        if (updateHistory) {
          const clean = new URLSearchParams(searchParams);
          clean.delete('section_id');
          const qsStr = clean.toString();
          history.pushState({ facets: qsStr }, '', `${window.location.pathname}${qsStr ? `?${qsStr}` : ''}`);
        }
      } catch (e) {
        window.location.search = searchParams;
      }
    }
    async loadMore(link) {
      link.classList.add('loading');
      const url = new URL(link.href, window.location.origin);
      url.searchParams.set('section_id', this.sectionId);
      try {
        const res = await fetch(url);
        const doc = parseHTML(await res.text());
        const freshGrid = qs('[data-product-grid]', doc);
        const grid = qs('[data-product-grid]', this);
        if (freshGrid && grid) Array.from(freshGrid.children).forEach((child) => grid.appendChild(child));
        const freshMore = qs('[data-load-more]', doc);
        const more = qs('[data-load-more]', this);
        if (more) {
          if (freshMore) more.innerHTML = freshMore.innerHTML;
          else more.remove();
        }
        observeReveal(this);
      } catch (e) {
        window.location.href = link.href;
      }
    }
  }
  customElements.define('facet-filters', FacetFilters);

  /* ==========================================================================
     Misc components
     ========================================================================== */
  class VideoPlayer extends HTMLElement {
    connectedCallback() {
      const btn = qs('[data-play]', this);
      const tpl = qs('template', this);
      if (!btn || !tpl) return;
      btn.addEventListener('click', () => {
        const content = tpl.content.cloneNode(true);
        btn.remove();
        this.appendChild(content);
        const video = qs('video', this);
        if (video) video.play();
      });
    }
  }
  customElements.define('video-player', VideoPlayer);

  class CountdownTimer extends HTMLElement {
    connectedCallback() {
      const end = new Date(this.dataset.end);
      if (isNaN(end)) return;
      const els = {
        d: qs('[data-days]', this),
        h: qs('[data-hours]', this),
        m: qs('[data-minutes]', this),
        s: qs('[data-seconds]', this)
      };
      const pad = (n) => String(n).padStart(2, '0');
      const tick = () => {
        let diff = Math.max(0, end - new Date());
        if (diff === 0) {
          clearInterval(this.timer);
          if (this.dataset.hideOnEnd === 'true') this.closest('.shopify-section')?.setAttribute('hidden', '');
        }
        const d = Math.floor(diff / 864e5); diff -= d * 864e5;
        const h = Math.floor(diff / 36e5); diff -= h * 36e5;
        const m = Math.floor(diff / 6e4); diff -= m * 6e4;
        const s = Math.floor(diff / 1e3);
        els.d.textContent = pad(d); els.h.textContent = pad(h); els.m.textContent = pad(m); els.s.textContent = pad(s);
      };
      tick();
      this.timer = setInterval(tick, 1000);
    }
    disconnectedCallback() { clearInterval(this.timer); }
  }
  customElements.define('countdown-timer', CountdownTimer);

  class BeforeAfter extends HTMLElement {
    connectedCallback() {
      const input = qs('input[type="range"]', this);
      input?.addEventListener('input', () => this.style.setProperty('--pos', `${input.value}%`));
    }
  }
  customElements.define('before-after', BeforeAfter);

  class ShopTheLook extends HTMLElement {
    connectedCallback() {
      const spots = qsa('[data-hotspot]', this);
      const cards = qsa('[data-hotspot-card]', this);
      spots.forEach((spot) =>
        spot.addEventListener('click', () => {
          spots.forEach((s) => s.setAttribute('aria-expanded', String(s === spot)));
          cards.forEach((c) => (c.hidden = c.dataset.hotspotCard !== spot.dataset.hotspot));
        })
      );
    }
  }
  customElements.define('shop-the-look', ShopTheLook);

  class NewsletterPopup extends OverlayElement {
    connectedCallback() {
      super.connectedCallback();
      if (this.hasAttribute('data-disabled') || this.dataset.designMode === 'true') return;
      const key = 'barcelona-newsletter-popup';
      let last = 0;
      try { last = Number(localStorage.getItem(key)) || 0; } catch (e) { /* storage blocked */ }
      const days = Number(this.dataset.frequency) || 7;
      const posted = qs('.form-message', this);
      if (posted) { this.open(); return; }
      if (Date.now() - last < days * 864e5) return;
      setTimeout(() => {
        if (qs('.drawer.is-open, .modal.is-open')) return;
        this.open();
        try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* storage blocked */ }
      }, Number(this.dataset.delay) || 0);
    }
  }
  customElements.define('newsletter-popup', NewsletterPopup);

  /* ==========================================================================
     Wishlist (stored in the browser, no app needed)
     ========================================================================== */
  const store = {
    read(key) {
      try { return JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return []; }
    },
    write(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
    }
  };

  const Wishlist = {
    key: 'barcelona-wishlist',
    get() { return store.read(this.key); },
    has(handle) { return this.get().includes(handle); },
    toggle(handle) {
      let list = this.get();
      const adding = !list.includes(handle);
      list = adding ? [handle, ...list] : list.filter((h) => h !== handle);
      store.write(this.key, list.slice(0, 100));
      this.sync();
      document.dispatchEvent(new CustomEvent('wishlist:change', { detail: { handle, adding, list } }));
      return adding;
    },
    clear() {
      store.write(this.key, []);
      this.sync();
      document.dispatchEvent(new CustomEvent('wishlist:change', { detail: { list: [] } }));
    },
    sync(root = document) {
      const list = this.get();
      qsa('[data-wishlist-toggle]', root).forEach((btn) => {
        const on = list.includes(btn.dataset.wishlistToggle);
        btn.setAttribute('aria-pressed', String(on));
        btn.classList.toggle('is-active', on);
        const label = qs('[data-wishlist-label]', btn);
        if (label) label.textContent = on ? theme.strings.wishlistRemove : theme.strings.wishlistAdd;
      });
      qsa('[data-wishlist-count]').forEach((el) => {
        el.textContent = list.length;
        el.hidden = list.length === 0;
      });
      qsa('[data-wishlist-count-text]').forEach((el) => { el.textContent = list.length; });
    }
  };
  window.BarcelonaWishlist = Wishlist;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wishlist-toggle]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const added = Wishlist.toggle(btn.dataset.wishlistToggle);
      btn.classList.remove('is-bump');
      void btn.offsetWidth;
      btn.classList.add('is-bump');
      toast(added ? (theme.strings.wishlistAdded || theme.strings.wishlistAdd) : theme.strings.wishlistRemoved);
      return;
    }
    if (e.target.closest('[data-wishlist-clear]')) {
      e.preventDefault();
      Wishlist.clear();
    }
  });

  /* Recently viewed */
  const Recent = {
    key: 'barcelona-recent',
    get() { return store.read(this.key); },
    add(handle) {
      if (!handle) return;
      store.write(this.key, [handle, ...this.get().filter((h) => h !== handle)].slice(0, 20));
    }
  };

  /* Renders product cards for a list of handles (wishlist, recently viewed) */
  class ProductListLoader extends HTMLElement {
    connectedCallback() {
      this.render();
      if (this.dataset.source === 'wishlist') {
        this._onChange = (e) => { if (!e.detail || !e.detail.adding) this.render(); };
        document.addEventListener('wishlist:change', this._onChange);
      }
    }
    disconnectedCallback() {
      if (this._onChange) document.removeEventListener('wishlist:change', this._onChange);
    }
    async render() {
      const grid = qs('[data-list-grid]', this);
      const empty = qs('[data-list-empty]', this);
      const limit = Number(this.dataset.limit) || 12;
      const exclude = this.dataset.exclude;
      const source = this.dataset.source === 'wishlist' ? Wishlist.get() : Recent.get();
      const handles = source.filter((h) => h !== exclude).slice(0, limit);

      if (!handles.length) {
        if (grid) grid.innerHTML = '';
        if (empty) empty.hidden = false;
        if (this.hasAttribute('data-hide-empty')) this.hidden = true;
        return;
      }
      if (empty) empty.hidden = true;

      const root = (theme.routes.root || '/').replace(/\/$/, '');
      const cards = await Promise.all(handles.map(async (handle) => {
        try {
          const res = await fetch(`${root}/products/${encodeURIComponent(handle)}?section_id=product-card-fragment`);
          if (!res.ok) return '';
          const doc = parseHTML(await res.text());
          const card = qs('.product-card', doc);
          return card ? `<div class="list-item">${card.outerHTML}</div>` : '';
        } catch (err) { return ''; }
      }));
      const html = cards.filter(Boolean).join('');
      if (!html) {
        if (empty) empty.hidden = false;
        if (this.hasAttribute('data-hide-empty')) this.hidden = true;
        return;
      }
      grid.innerHTML = html;
      this.hidden = false;
      Wishlist.sync(grid);
      qsa('.reveal', grid).forEach((el) => el.classList.add('is-revealed'));
      const slider = this.querySelector('slider-component');
      if (slider && slider._update) requestAnimationFrame(slider._update);
    }
  }
  customElements.define('product-list-loader', ProductListLoader);

  /* ==========================================================================
     Mobile navigation bar
     ========================================================================== */
  class MobileNavBar extends HTMLElement {
    connectedCallback() {
      const setHeight = () => {
        const visible = window.getComputedStyle(this).display !== 'none';
        document.documentElement.style.setProperty('--mobile-bar-height', visible ? `${this.offsetHeight}px` : '0px');
      };
      setHeight();
      window.addEventListener('resize', debounce(setHeight, 150));
      if (this.dataset.hideOnScroll === 'true') {
        let lastY = window.scrollY;
        window.addEventListener('scroll', () => {
          const y = window.scrollY;
          this.classList.toggle('is-hidden', y > lastY && y > 200);
          lastY = y;
        }, { passive: true });
      }
    }
  }
  customElements.define('mobile-nav-bar', MobileNavBar);

  /* ==========================================================================
     Count-up numbers (results)
     ========================================================================== */
  const runCountUp = (el) => {
    el.classList.add('is-counted');
    qsa('[data-count-to]', el).forEach((num) => {
      const target = Number(num.dataset.countTo) || 0;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { num.textContent = target; return; }
      const start = performance.now();
      const duration = 1400;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        num.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      num.textContent = '0';
      requestAnimationFrame(tick);
    });
  };
  let countObserver;
  const observeCountUp = (root = document) => {
    const els = qsa('[data-count-up]:not(.is-counted)', root);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(runCountUp); return; }
    countObserver = countObserver || new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCountUp(entry.target);
        countObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    els.forEach((el) => countObserver.observe(el));
  };

  /* ==========================================================================
     Skin quiz
     ========================================================================== */
  class SkinQuiz extends HTMLElement {
    connectedCallback() {
      this.screens = qsa('[data-quiz-screen]', this);
      this.questions = qsa('[data-quiz-screen="q"]', this);
      this.answers = [];
      this.addEventListener('click', (e) => {
        if (e.target.closest('[data-quiz-start]')) return this.show(this.questions[0]);
        if (e.target.closest('[data-quiz-restart]')) { this.answers = []; return this.show(this.screens[0]); }
        if (e.target.closest('[data-quiz-back]')) {
          const idx = this.questions.indexOf(this.current);
          if (idx <= 0) { this.answers = []; return this.show(this.screens[0]); }
          this.answers.length = idx - 1;
          return this.show(this.questions[idx - 1]);
        }
        const answer = e.target.closest('[data-quiz-answer]');
        if (answer) {
          const idx = Math.max(0, this.questions.indexOf(this.current));
          this.answers.length = idx;
          this.answers.push(answer.dataset.quizAnswer);
          this.show(this.questions[idx + 1] || this.result());
        }
      });
    }
    result() {
      const tally = {};
      this.answers.forEach((key) => { if (key) tally[key] = (tally[key] || 0) + 1; });
      const ranked = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);
      const results = qsa('[data-quiz-result]', this);
      return ranked.map((k) => results.find((r) => r.dataset.quizResult === k)).find(Boolean) || results[0] || this.screens[0];
    }
    show(screen) {
      if (!screen) return;
      this.current = screen;
      this.screens.forEach((s) => {
        const on = s === screen;
        s.hidden = !on;
        s.classList.toggle('is-active', on);
      });
      const focusable = qs('legend, h2, button', screen);
      if (focusable) {
        if (!focusable.hasAttribute('tabindex') && focusable.tagName !== 'BUTTON') focusable.setAttribute('tabindex', '-1');
        focusable.focus({ preventScroll: true });
      }
      const top = this.getBoundingClientRect().top;
      if (top < 0) this.scrollIntoView({ behavior: 'smooth', block: 'start' });
      Wishlist.sync(screen);
    }
  }
  customElements.define('skin-quiz', SkinQuiz);

  /* ==========================================================================
     Delivery estimate
     ========================================================================== */
  class DeliveryEstimate extends HTMLElement {
    connectedCallback() {
      const min = Number(this.dataset.min) || 0;
      const max = Number(this.dataset.max) || min;
      const cutoff = Number(this.dataset.cutoff);
      const skipWeekends = this.dataset.skipWeekends === 'true';
      const now = new Date();
      const addDays = (from, days) => {
        const d = new Date(from);
        let added = 0;
        while (added < days) {
          d.setDate(d.getDate() + 1);
          if (!skipWeekends || (d.getDay() !== 0 && d.getDay() !== 6)) added += 1;
        }
        return d;
      };
      let start = new Date(now);
      const pastCutoff = now.getHours() >= cutoff;
      if (pastCutoff || (skipWeekends && (now.getDay() === 0 || now.getDay() === 6))) start = addDays(now, 1);
      const fmt = new Intl.DateTimeFormat(this.dataset.locale || undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const from = addDays(start, min);
      const to = addDays(start, max);
      const range = min === max ? fmt.format(from) : `${fmt.format(from)} – ${fmt.format(to)}`;
      const text = qs('[data-delivery-text]', this);
      if (!text) return;

      if (!pastCutoff && !(skipWeekends && (now.getDay() === 0 || now.getDay() === 6))) {
        const end = new Date(now); end.setHours(cutoff, 0, 0, 0);
        const update = () => {
          const diff = Math.max(0, end - new Date());
          const h = Math.floor(diff / 36e5);
          const m = Math.floor((diff % 36e5) / 6e4);
          const countdown = `<strong>${h}h ${m}m</strong>`;
          text.innerHTML = this.dataset.template.replace('[date]', `<strong>${range}</strong>`).replace('[countdown]', countdown);
        };
        update();
        this.timer = setInterval(update, 30000);
      } else {
        text.innerHTML = this.dataset.templateSimple.replace('[date]', `<strong>${range}</strong>`);
      }
    }
    disconnectedCallback() { clearInterval(this.timer); }
  }
  customElements.define('delivery-estimate', DeliveryEstimate);

  /* Back to top */
  const backToTop = qs('[data-back-to-top]');
  if (backToTop) {
    window.addEventListener('scroll', debounce(() => { backToTop.hidden = window.scrollY < window.innerHeight * 1.5; }, 100), { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const initBarcelona = () => {
    Wishlist.sync();
    observeCountUp();
    const productSection = qs('.section-main-product [data-product-handle]');
    if (productSection) Recent.add(productSection.dataset.productHandle);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBarcelona);
  else initBarcelona();
  document.addEventListener('cart:changed', () => Wishlist.sync());

  /* Scroll reveal */
  let revealObserver;
  const observeReveal = (root = document) => {
    if (!document.body.classList.contains('animate')) return;
    if (!('IntersectionObserver' in window)) {
      qsa('.reveal', root).forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    revealObserver = revealObserver || new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    qsa('.reveal:not(.is-revealed)', root).forEach((el) => revealObserver.observe(el));
  };

  document.addEventListener('DOMContentLoaded', () => observeReveal());
  if (document.readyState !== 'loading') observeReveal();

  /* ==========================================================================
     Theme editor support
     ========================================================================== */
  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', (e) => {
      qsa('.reveal', e.target).forEach((el) => el.classList.add('is-revealed'));
      Wishlist.sync(e.target);
      observeCountUp(e.target);
      if (qs('newsletter-popup', e.target)) qs('newsletter-popup', e.target).open();
    });
    document.addEventListener('shopify:section:select', (e) => {
      const popup = qs('newsletter-popup', e.target);
      if (popup) popup.open();
    });
    document.addEventListener('shopify:section:deselect', (e) => {
      const popup = qs('newsletter-popup', e.target);
      if (popup) popup.close();
    });
    document.addEventListener('shopify:block:select', (e) => {
      const block = e.target;
      const bar = block.closest('announcement-bar');
      if (bar) bar.select(block);
      const slider = block.closest('slider-component');
      if (slider && slider.goTo) {
        const sl = slider.slider;
        const idx = Array.from(sl?.children || []).indexOf(block);
        if (idx > -1) slider.goTo(idx);
      }
      const sheet = block.closest('.discover-sheet');
      if (sheet && sheet.open) sheet.open();
      const navItem = qs('.mega-menu', document) && block.classList.contains('mega-menu__promo') ? block.closest('[data-nav-item]') : null;
      if (navItem) navItem.classList.add('is-open');
    });
    qsa('.reveal').forEach((el) => el.classList.add('is-revealed'));
  }
})();
