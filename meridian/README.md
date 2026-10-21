# Meridian — a jewelry theme built on Dawn

Meridian is an Online Store 2.0 theme for fine-jewelry brands, built on Shopify's [Dawn](https://github.com/Shopify/dawn) 16.0.0. The look is clean and editorial: white and stone surfaces, uppercase grotesk headings, square buttons and a deep espresso accent.

## What's added on top of Dawn

| Area | Feature |
| --- | --- |
| Theme settings | "Meridian" preset: Archivo + Inter, five color schemes (white, stone card, espresso, cream, overlay), drawer cart, square pills and badges |
| Header | Centered logo with the menu below it, plus a wishlist icon with a live count |
| Product cards | A tag badge in the corner (tag a product `badge:New in` or `badge:Back in stock`) and a heart that toggles the wishlist |
| `product-carousel` | Heading with arrows top-right and a horizontally scrolling row; the half-card peek is configurable |
| `collection-tiles` | Full-bleed image tiles with centered uppercase titles (Necklaces / Earrings / …) |
| `instagram-gallery` | "Get inspired by our community" scrolling image row with optional tagged products |
| `press-marquee` | "Featured in" scrolling list of press names or logos |
| `product-tabs` | Tabbed panel for Product overview / Packaging / Shipping & returns, placed under the product |
| Product page | Wishlist button block next to Add to bag, and a "Show product description" option on collapsible rows |
| Wishlist | Stored in the browser; the `page.wishlist` template renders saved products |

## Setup

1. Upload: `cd meridian && zip -r ../meridian.zip assets config layout locales sections snippets templates`, then go to *Online Store → Themes → Add theme → Upload zip file*. With the Shopify CLI, run `shopify theme push --unpublished` from `meridian/`.
2. Create a page called **Wishlist**, assign it the `page.wishlist` template, and select it under *Theme settings → Wishlist & badges*.
3. Add product tags such as `badge:New in` to show card badges.
4. On the home page, point both product carousels at your collections and add images to the hero, tiles and community gallery.
5. For "Perfect match with" on the product page, add Dawn's *Complementary products* block. It's powered by the Search & Discovery app.

Dawn is © Shopify under its MIT-style license (see `LICENSE.md`).
