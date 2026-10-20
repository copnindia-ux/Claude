/* Shoppable reels: muted in-view previews and a full-screen story viewer */
(() => {
  'use strict';
  if (customElements.get('shoppable-reels')) return;

  const B = window.Barcelona;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const safePlay = (video) => {
    if (!video) return;
    if (video.preload === 'none') video.preload = 'metadata';
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  class ShoppableReels extends HTMLElement {
    connectedCallback() {
      this.viewer = this.querySelector('reels-viewer');
      this.videos = Array.from(this.querySelectorAll('.reel__video'));

      if (this.dataset.autoplay === 'true' && !reducedMotion() && 'IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting && !document.body.classList.contains('overflow-hidden')) safePlay(video);
            else video.pause();
          });
        }, { threshold: 0.6 });
        this.videos.forEach((v) => this.observer.observe(v));
      } else {
        // Hover-to-preview when autoplay is off
        this.videos.forEach((v) => {
          const card = v.closest('.reel');
          card.addEventListener('mouseenter', () => safePlay(v));
          card.addEventListener('mouseleave', () => v.pause());
        });
      }

      this.addEventListener('click', (e) => {
        const opener = e.target.closest('[data-reel-open]');
        if (!opener || !this.viewer) return;
        e.preventDefault();
        this.videos.forEach((v) => v.pause());
        this.viewer.openAt(Number(opener.dataset.reelOpen), opener);
      });
      this.addEventListener('overlay:close', () => {
        if (this.dataset.autoplay !== 'true' || !this.observer) return;
        this.videos.forEach((v) => { this.observer.unobserve(v); this.observer.observe(v); });
      });
    }
    disconnectedCallback() { this.observer?.disconnect(); }
  }

  const Overlay = (B && B.OverlayElement) || HTMLElement;

  class ReelsViewer extends Overlay {
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      if (this._init) return;
      this._init = true;
      this.track = this.querySelector('[data-reels-track]');
      this.slides = Array.from(this.querySelectorAll('[data-reels-slide]'));
      this.muted = true;
      this.index = 0;

      this.querySelector('[data-reels-mute]')?.addEventListener('click', (e) => {
        this.muted = !this.muted;
        e.currentTarget.setAttribute('aria-pressed', String(this.muted));
        const v = this.videoAt(this.index);
        if (v) v.muted = this.muted;
      });
      this.querySelector('[data-reels-prev]')?.addEventListener('click', () => this.go(this.index - 1));
      this.querySelector('[data-reels-next]')?.addEventListener('click', () => this.go(this.index + 1));
      this.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); this.go(this.index + 1); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.index - 1); }
      });

      // Tap the video to pause / resume
      this.slides.forEach((slide, i) => {
        const media = slide.querySelector('.reels-viewer__media');
        media?.addEventListener('click', () => {
          const v = this.videoAt(i);
          if (!v) return;
          v.paused ? safePlay(v) : v.pause();
        });
        const v = this.videoAt(i);
        if (!v) return;
        const bar = slide.querySelector('[data-reels-progress]');
        v.addEventListener('timeupdate', () => {
          if (bar && v.duration) bar.style.transform = `scaleX(${v.currentTime / v.duration})`;
        });
        v.addEventListener('ended', () => {
          if (i < this.slides.length - 1) this.go(i + 1);
          else { v.currentTime = 0; safePlay(v); }
        });
      });

      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || !this.classList.contains('is-open')) return;
            this.activate(this.slides.indexOf(entry.target));
          });
        }, { root: this.track, threshold: 0.6 });
        this.slides.forEach((s) => this.io.observe(s));
      }
    }
    videoAt(i) { return this.slides[i]?.querySelector('video'); }
    activate(i) {
      if (i < 0) return;
      this.index = i;
      this.slides.forEach((slide, idx) => {
        const v = this.videoAt(idx);
        slide.classList.toggle('is-active', idx === i);
        if (!v) return;
        if (idx === i) {
          v.muted = this.muted;
          safePlay(v);
        } else {
          v.pause();
        }
      });
      // Warm up the next video
      const next = this.videoAt(i + 1);
      if (next && next.preload === 'none') next.preload = 'metadata';
    }
    go(i) {
      if (i < 0 || i >= this.slides.length) return;
      this.slides[i].scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
      this.activate(i);
    }
    openAt(i, opener) {
      this.open(opener);
      requestAnimationFrame(() => {
        this.slides[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        this.activate(i);
      });
    }
    close() {
      this.slides.forEach((_, idx) => this.videoAt(idx)?.pause());
      super.close();
    }
  }

  customElements.define('shoppable-reels', ShoppableReels);
  customElements.define('reels-viewer', ReelsViewer);
})();
