(() => {
  const KEY = 'meridian:wishlist';

  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  };

  const write = (list) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('wishlist:change', { detail: { list } }));
  };

  const sync = () => {
    const list = read();
    document.querySelectorAll('[data-wishlist-handle]').forEach((el) => {
      const active = list.includes(el.dataset.wishlistHandle);
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-pressed', active);
      const label = el.querySelector('[data-wishlist-label]');
      if (label) label.textContent = active ? el.dataset.labelRemove : el.dataset.labelAdd;
    });
    document.querySelectorAll('[data-wishlist-count]').forEach((el) => {
      el.textContent = list.length;
      el.hidden = list.length === 0;
    });
  };

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wishlist-handle]');
    if (!button) return;
    event.preventDefault();
    const handle = button.dataset.wishlistHandle;
    const list = read();
    const index = list.indexOf(handle);
    index === -1 ? list.unshift(handle) : list.splice(index, 1);
    write(list);
  });

  class WishlistGrid extends HTMLElement {
    connectedCallback() {
      this.render();
      document.addEventListener('wishlist:change', () => this.render());
    }

    async render() {
      const list = read();
      const grid = this.querySelector('[data-wishlist-grid]');
      const empty = this.querySelector('[data-wishlist-empty]');
      empty.hidden = list.length > 0;
      if (!list.length) {
        grid.innerHTML = '';
        return;
      }
      const cards = await Promise.all(
        list.map((handle) =>
          fetch(`${window.Shopify.routes.root}products/${handle}?view=card`)
            .then((response) => (response.ok ? response.text() : ''))
            .catch(() => '')
        )
      );
      grid.innerHTML = cards.filter(Boolean).map((html) => `<li class="grid__item">${html}</li>`).join('');
      sync();
    }
  }
  customElements.define('wishlist-grid', WishlistGrid);

  document.addEventListener('wishlist:change', sync);
  document.addEventListener('DOMContentLoaded', sync);
  document.addEventListener('shopify:section:load', sync);
  sync();
})();
