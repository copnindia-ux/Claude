# Halo — a minimal beauty & skincare Shopify theme

Halo is an Online Store 2.0 Shopify theme for minimal skincare and beauty brands. It has a soft, editorial style: a cream and neutral palette, lowercase type, full-bleed imagery, quiet product cards with shade swatches and a slide-out bag.

All code, copy and design tokens are original. Before launch, add your own logo, imagery and copy in the theme editor.

## Installing

**Upload as a zip**

```bash
zip -r halo.zip assets config layout locales sections snippets templates
```

Then go to *Online Store → Themes → Add theme → Upload zip file*.

**Shopify CLI**

```bash
shopify theme dev --store your-store.myshopify.com    # live preview
shopify theme push --unpublished                      # upload as a new theme
shopify theme check                                   # lint
```

## Features

### Global (Theme settings)
- **Color schemes:** five ready-made schemes (cream, white, blush, dark, sage). Every section can pick its own scheme.
- **Typography:** heading and body fonts from the Shopify font library, size scales, letter spacing, and a *lowercase / UPPERCASE / as written* switch for headings, nav and buttons.
- **Layout:** page width, side padding, section spacing, grid gap and scroll-reveal animations.
- **Buttons & inputs:** corner radius and height.
- **Product cards:** image ratio, padding and radius, a second image on hover, vendor, subtitle, rating, color swatches and quick add.
- **Badges:** sale badges (text or % off), sold-out badges, and custom badges set with product tags (`badge:new`, `badge:bestseller`).
- **Cart:** drawer or page, order notes, a free-shipping progress bar, an upsell collection in the drawer, and a featured collection when the cart is empty.
- **Search:** predictive search for products, collections, pages, articles and suggestions, plus a "popular searches" menu.
- **Social links, favicon, inverse logo** (used on the transparent header).

### Header & footer
- Rotating announcement bar with optional utility links and social icons.
- Header with the logo centered or on the left, and a full-width mega menu (with image promo blocks) or a simple dropdown.
- Sticky header: always, on scroll up, or off. Transparent-over-hero option for the home page.
- Mobile drawer menu with promo tiles, account link and country/language selectors.
- Footer with a newsletter, menu, text and image blocks, a large wordmark, payment icons, policy links and country/language selectors.
- Newsletter pop-up with delay, frequency cap and image.

### Sections
Hero banner (image, mobile image or video) · Slideshow · Split hero · Scrolling marquee (text or press logos) · Featured collection (grid or carousel, collection tabs) · Collection list · Featured product · Image with text (with an optional product card) · Multicolumn / benefits · Rich text · Testimonials · FAQ (with FAQ structured data) · Video (Shopify-hosted, YouTube or Vimeo) · Newsletter · Shoppable UGC gallery · Shop the look (hotspots) · Before/after slider · Countdown · Blog posts · Contact form · Custom Liquid · Apps

### Product page
- Media in a grid, stacked, or as a carousel with thumbnails. Supports images, video, 3D models and a lightbox.
- Variant pills or dropdowns. Color and shade options automatically become swatches, using Shopify's native option swatches or a CSS color-name fallback.
- Unavailable combinations are struck through, and the URL, price, inventory, SKU, pickup and media update live.
- Add to bag with quantity, dynamic checkout buttons, selling plans (subscriptions) and a sticky add-to-bag bar.
- Blocks: title, subtitle (`custom.subtitle` metafield), vendor, price, rating (`reviews.rating`), inventory status with low-stock threshold, SKU, description, highlights with icons, collapsible tabs (connect metafields for ingredients and how-to-use), complementary products, share, pop-up page, custom Liquid and app blocks.
- Related-product recommendations and Product JSON-LD.

### Collection & search
- Storefront filtering with list, swatch and price-range filters, sorting, active filter pills, and a filter drawer or sidebar. Results update via AJAX with history support.
- Load-more button or numbered pagination.
- Promotional tiles inside the product grid.
- Collection banner from the `custom.banner_image` metafield or the collection image, plus category pills.

### Other templates
Cart page, blog, article (with comments), pages (default, contact, FAQ, about), 404, password page, gift card, and all customer account pages (login, register, account, order, addresses, activate, reset).

## Recommended setup
1. **Navigation:** create a `main-menu` (nested links become the mega menu) and a `footer` menu.
2. **Metafields** (Settings → Custom data → Products):
   - `custom.subtitle` (single-line text) shows under product titles.
   - Rich-text metafields for ingredients and how-to-use, connected to the collapsible tabs through dynamic sources.
3. **Filters:** install Shopify's *Search & Discovery* app to configure filters, swatch filters, and complementary products.
4. **Swatches:** set option swatches on your products (color or image). If none are set, the option name is used as a CSS color. The *Swatch option names* setting controls which options render as swatches.
5. **Badges:** tag products `badge:new`, `badge:limited edition`, and so on.

## File structure
```
layout/      theme.liquid, password.liquid
templates/   JSON templates + customers/*.liquid + gift_card.liquid
sections/    all sections, header/footer groups, Section Rendering API helpers
snippets/    product card, price, cart drawer, facets, icons, etc.
assets/      base.css, theme.js (vanilla JS, no dependencies)
config/      settings_schema.json, settings_data.json
locales/     en.default.json
```
