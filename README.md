# Barcelona — a skincare Shopify theme

Barcelona is an Online Store 2.0 Shopify theme for skincare brands. It builds on Halo (everything Halo has is still here) and adds the features a modern skincare store needs: an app-style mobile navigation bar, a wishlist, an illustrated menu, a dedicated results section, shoppable reels, a skin quiz, a routine builder and skincare product blocks. The look is warm and Mediterranean (sand, clay, olive and terracotta), with tight letter spacing, compact section spacing, frosted-glass bars and soft motion.

All code, copy and design tokens are original. Before launch, add your own logo, imagery and copy in the theme editor.

## Installing

**Upload as a zip**

```bash
zip -r barcelona.zip assets config layout locales sections snippets templates
```

Then go to *Online Store → Themes → Add theme → Upload zip file*.

**Shopify CLI**

```bash
shopify theme dev --store your-store.myshopify.com    # live preview
shopify theme push --unpublished                      # upload as a new theme
shopify theme check                                   # lint
```

## What's new in Barcelona

### Mobile navigation bar
A fixed, app-style bar on phones and tablets (*Footer → Mobile navigation bar*): **menu, discover, wishlist, cart and account**, with live cart and wishlist counts. Floating pill or docked style, optional labels, hide-on-scroll. *Discover* opens a bottom sheet with search, illustrated category tiles, a trending-searches menu and a product carousel, or it can open search or a link instead.

### Wishlist (no app needed)
Heart buttons on product cards and a *Wishlist button* product block. Saved items live in the shopper's browser. Create a page, assign it the `wishlist` template, then pick it in *Theme settings → Wishlist*. The header and mobile bar show the count.

### Illustrated menu
The mega menu and mobile menu show second-level links as illustrated tiles. 18 built-in line illustrations (serum, cream, cleanser, sunscreen, toner, mask, eye, lip, body, tools, sets, new, bestsellers...) are matched automatically from link titles. Override any link with a *Menu illustration* block, or upload your own image. Turn it off with *Header → Illustrated menu*.

### New sections
- **Results:** clinical stats with animated count-up rings or bars, an image with a badge, a week-by-week progress timeline, a button and a study footnote.
- **Shoppable reels:** vertical video cards that autoplay muted in view, with the product under each. Tapping opens a full-screen story viewer (swipe or arrow keys, progress bar, sound toggle) with add-to-bag for up to 3 products per reel.
- **Skin quiz:** multi-step quiz with illustrated answers and a progress bar; each answer points to a result key and the best match shows its recommended products.
- **Routine builder:** morning / night tabs with numbered steps, product, tip, routine total and an *add the routine* button that adds every step in one go.
- **Ingredient spotlight:** interactive ingredient list with concentration, origin, benefit and tags.
- **Comparison table:** you vs. others with checks, crosses or text.
- **Illustrated categories:** category tiles or circles using the same illustrations.
- **Recently viewed:** products the shopper viewed, hidden until there is something to show.

### Product page blocks
Wishlist button · Skin type & concerns (from `custom.skin_types` / `custom.concerns` list metafields, with fallbacks) · Key ingredients · Results with animated meters · Delivery estimate with a dispatch-cutoff countdown · Trust badges.

### Interface & settings
- Tighter type: heading letter spacing −0.04em and body −0.01em by default (now down to −0.08em), balanced headings.
- **Section padding scale** (*Theme settings → Layout*) shrinks every section's padding at once; default 70%.
- Frosted-glass sticky header and bars, smooth page transitions (View Transitions API), back-to-top button, rounded 12px cards and inputs, spring micro-interactions.
- Six color schemes: sand, white, clay, night, olive and terracotta.

## Features (from Halo)

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
   - `custom.skin_types` and `custom.concerns` (list of single-line text) feed the *Skin type & concerns* block.
   - Rich-text metafields for ingredients and how-to-use, connected to the collapsible tabs through dynamic sources.
3. **Filters:** install Shopify's *Search & Discovery* app to configure filters, swatch filters, and complementary products.
4. **Swatches:** set option swatches on your products (color or image). If none are set, the option name is used as a CSS color. The *Swatch option names* setting controls which options render as swatches.
5. **Badges:** tag products `badge:new`, `badge:limited edition`, and so on.
6. **Wishlist page:** create a page called *Wishlist*, choose the `wishlist` template, and select it in *Theme settings → Wishlist*.
7. **Reels:** upload vertical (9:16) MP4s in each Reel block and pick up to three products.

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
