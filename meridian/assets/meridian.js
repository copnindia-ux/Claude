if (!customElements.get('product-carousel')) {
  customElements.define(
    'product-carousel',
    class ProductCarousel extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('.m-carousel__track');
        this.buttons = this.querySelectorAll('.m-carousel__arrow');
        this.buttons.forEach((button) =>
          button.addEventListener('click', () => this.scroll(Number(button.dataset.dir)))
        );
        this.track.addEventListener('scroll', () => this.update(), { passive: true });
        this.update();
      }

      scroll(direction) {
        const slide = this.track.querySelector('.m-carousel__slide');
        if (!slide) return;
        this.track.scrollBy({ left: direction * slide.offsetWidth * 2, behavior: 'smooth' });
      }

      update() {
        const max = this.track.scrollWidth - this.track.clientWidth - 2;
        this.buttons[0].disabled = this.track.scrollLeft <= 0;
        this.buttons[1].disabled = this.track.scrollLeft >= max;
      }
    }
  );
}

if (!customElements.get('m-tabs')) {
  customElements.define(
    'm-tabs',
    class MTabs extends HTMLElement {
      connectedCallback() {
        this.tabs = [...this.querySelectorAll('[role="tab"]')];
        this.panels = [...this.querySelectorAll('[role="tabpanel"]')];
        this.tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => this.select(index));
          tab.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + this.tabs.length) % this.tabs.length;
            this.select(next);
            this.tabs[next].focus();
          });
        });
      }

      select(active) {
        this.tabs.forEach((tab, index) => {
          tab.setAttribute('aria-selected', index === active);
          tab.tabIndex = index === active ? 0 : -1;
          this.panels[index].hidden = index !== active;
        });
      }
    }
  );
}
