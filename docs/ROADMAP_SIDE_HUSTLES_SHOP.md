# Tripman Roadmap — “Side Hustles” Shop Expansion

_Last updated: 2026-02-13_

This document is the **implementation roadmap** for adding a merch/shop (“Side Hustles”: t‑shirts, hoodies, etc.) while preserving the existing **booking + payments** product that is already live.

## 1) Current system snapshot (baseline we must not break)

**App**: Next.js 15 (App Router) + React 19 + TypeScript  
**UI**: Tailwind v4 + shadcn/ui (Radix primitives)  
**DB**: Postgres (Neon) + Prisma  
**Payments**: Stripe PaymentIntents + webhook-confirmed booking status  
**Email**: Resend + `.ics` attachments  
**Scheduling**:

- Custom mode: `/api/availability` (rules/blocks/buffers/min-notice) + optional Google Calendar free/busy
- Embed mode: Cal.com/Calendly embed + `/api/webhooks/cal` sync
  **Admin**: `/admin` dashboard (bookings, availability rules/blocks, settings, fraud review tooling)
  **Marketing/SEO**: OG image endpoint, sitemap, metadata, GA4 + Vercel analytics/insights

### Why this matters

The booking flow is already **revenue-critical**. Any shop work must be isolated so it:

- cannot cause double-booking
- cannot weaken payment confirmation rules
- cannot degrade page speed (especially homepage + booking)

## 2) Non-negotiables (production hygiene)

### 2.1 Secrets and access control (CRITICAL)

This repo currently includes a `.env.local` containing **live** credentials. Treat as leaked.

**Rotate immediately**:

- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (and verify endpoint URLs)
- Neon/Postgres: rotate DB password / connection string
- Resend: `RESEND_API_KEY`
- Admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
- Tracking secret: `TRACKING_API_SECRET` (if used)
- Google service account key: `GOOGLE_PRIVATE_KEY` (if used)

**Rule**: never commit or share `.env.local` or any secrets in screenshots / posts.

### 2.2 Minimal hardening before adding traffic

- Add **rate limiting** / bot protection to:
  - `/api/booking`
  - `/api/availability`
  - `/api/contact`
  - `/api/admin/session` (admin login)
- Tighten `/api/webhooks/cal` signature verification (current check is intentionally simplistic).

## 3) Product goal for “Side Hustles”

Tripman wants to keep the booking microsite and add:

- a **new shop section** on the homepage (marketing)
- a **shop experience** for browsing + purchasing merch
- a clean, trackable funnel (analytics + conversion)
- operational clarity (orders, email receipts, policies)

## 4) Architecture decision (choose intentionally)

### Option A — Add shop into this same Next.js app (recommended default)

**Shape**: `/shop` routes inside this codebase and same domain.

**Checkout approach**:

- **A1: Stripe Checkout (recommended for v1)**  
  Quick to ship, secure, built-in address collection, taxes/shipping via Stripe features, minimal custom PCI surface.
- **A2: Custom cart + PaymentIntents**  
  More control, more work (cart state, tax/shipping calculations, more edge cases).

**Pros**

- Unified branding and UX
- Shared analytics and SEO authority
- Easy cross-sell: booking → merch and merch → booking

**Cons**

- You own “store complexity” (variants, inventory, shipping policies, returns) unless you keep scope small

### Option B — Separate storefront (recommended if merch becomes a serious business)

**Shape**: Keep booking app stable. Put shop on `shop.` subdomain or separate platform (e.g., Shopify).

**Pros**

- Best-in-class commerce operations (inventory, discounts, abandoned carts, shipping)
- Isolates risk from booking stack

**Cons**

- Split analytics/cookies unless carefully configured
- More integration overhead to cross-sell and keep design consistent

### Recommendation

Ship **Option A1 (Stripe Checkout)** as the MVP. Reassess after 2–4 weeks of real sales/ops feedback.

## 5) Proposed phases (analysis + planning → execution later)

> This roadmap assumes **today is planning only**. Implementation phases are written so a teammate can execute them in order.

### Phase 0 — Stabilize & guardrails (1–2 days)

**Goal**: protect production and create clean boundaries for the shop work.

Deliverables:

- Rotate secrets; ensure `.env.local` is excluded from sharing processes
- Add a feature flag:
  - `NEXT_PUBLIC_ENABLE_SHOP=true|false`
- Update SEO hygiene:
  - Remove `/admin` from sitemap
  - Add `noindex,nofollow` metadata for admin routes
- Add basic rate limiting strategy (implementation later)
- Add a short “deploy checklist” note to docs (optional)

Acceptance criteria:

- Booking works exactly as before
- Admin access still gated
- No secrets appear in repo artifacts intended for sharing

### Phase 1 — MVP shop experience (3–7 days)

**Goal**: sell merch safely with minimal new complexity.

User-facing scope:

- Homepage: new section “Side Hustles”
  - strong CTA button → `/shop`
  - highlight 3–6 products, simple copy
- `/shop` listing page:
  - product tiles (image, title, price, “Buy”)
- `/shop/[slug]` product page (optional but recommended):
  - product details, size guide, shipping note, returns note
- `/shop/success` and `/shop/cancel` pages

Payment scope (recommended):

- Stripe Checkout sessions created server-side
- Order confirmation happens via webhook (source of truth)

Operational scope:

- Send customer “Order received” email (Resend)
- Send admin “New order” email (Resend)

Data scope:

- Keep product catalog **simple** at first:
  - Either hardcoded `PRODUCTS` list in code (fast)
  - Or minimal DB `Product` model (still simple, more flexible)

Acceptance criteria:

- Customer can buy an item end-to-end
- Stripe dashboards show sessions and payments
- Webhook records an order (and is idempotent)
- Confirmation email is delivered
- Booking flow unaffected

### Phase 1.1 — MVP shop content (same sprint)

**Goal**: avoid an “empty store” launch and make the drop feel intentional.

Deliverables:

- Define **Drop v1** scope:
  - 3–6 items max (ops-friendly)
  - 1–2 hero items (hoodie/tee) + 1 low-price impulse item (stickers/accessories)
- Product copy template (per item):
  - 1 headline
  - 1 short paragraph
  - 3 bullets (material/fit/print)
  - “Shipping & returns” one-liner + link
- Media checklist:
  - consistent background + lighting
  - 1:1 + 4:5 crops
  - size guide image (optional but high ROI)

Acceptance criteria:

- Shop pages look “real” even with a small catalog

### Phase 1.2 — MVP shop operations (same sprint)

**Goal**: reduce support load from day 1.

Deliverables:

- Customer email includes:
  - items summary
  - amount + currency
  - expected shipping timeline
  - support contact
- Admin email includes:
  - item snapshot
  - customer email
  - amount total
  - Stripe session/payment reference for quick lookup

Acceptance criteria:

- Tripman can fulfill orders without guessing what was purchased

### Phase 2 — Analytics + funnel optimization (2–4 days)

**Goal**: measure conversion and marketing effectiveness.

Deliverables:

- GA4 events for shop:
  - `view_item_list`, `view_item`, `begin_checkout`, `purchase`
- Attribute conversions:
  - capture UTM params and persist through checkout (metadata)
- Add lightweight A/B friendly structure:
  - configurable hero/CTA copy for shop section

Acceptance criteria:

- You can answer: “Where do buyers come from?” and “Which products convert?”

### Phase 3 — Commerce essentials (1–2 weeks, as needed)

**Goal**: reduce support burden and handle real-world edge cases.

Pick based on Tripman ops needs:

- Variants: sizes/colors
- Shipping:
  - address collection
  - shipping rates (flat rate first)
- Taxes (depending on jurisdiction requirements)
- Discount codes / promo drops
- Stock/out-of-stock behavior (even if manual)
- Branded transactional emails for orders
- Refund/return workflow documentation (even if manual)

Acceptance criteria:

- Orders are operationally manageable (low manual work, low confusion)

### Phase 4 — Admin tooling for shop (optional, 3–10 days)

**Goal**: reduce reliance on Stripe dashboard for daily operations.

Add admin tabs/routes for:

- Orders list (status: pending/paid/fulfilled/refunded)
- Product list (if DB-backed)
- Basic fulfillment notes / tracking number storage (optional)

Security requirements:

- Must use existing `requireAdmin()` guard
- Never expose customer PII publicly

### Phase 5 — Cross-sell & retention (ongoing)

**Goal**: maximize revenue per visitor without harming UX.

Ideas:

- Booking confirmation page (`/booking/[id]`) shows “limited drop” merch CTA (subtle)
- Shop success page includes booking CTA
- Email capture (opt-in) + drop announcements
- “Bundles” pricing (hoodie + tee)

### Phase 6 — Scale decision point (2–6 weeks after MVP launch)

**Goal**: decide whether to stay “Stripe Checkout in-app” or move to a dedicated commerce platform.

Decision triggers:

- Too many variants/inventory/shipping rules
- Need abandoned cart flows
- Need robust discounting and fulfillment integrations

Outcome:

- Stay Option A and improve incrementally, or
- Move to Option B (Shopify/storefront) while keeping booking stable

### Phase 7 — Brand refresh pass (site-wide polish, 2–7 days)

**Goal**: make booking + shop feel like one cohesive, premium Tripman experience.

Deliverables (choose selectively):

- Unify section spacing + typography scale across the landing page
- Add a single “signature” hero animation (spotlight/glow) that feels Tripman
- Improve section transitions (consistent reveal + stagger)
- Add an “IG proof” strip:
  - use existing Instagram embed API if configured
  - graceful fallback when not configured

Acceptance criteria:

- Landing page looks shareable (people want to post it / screenshot it)

### Phase 8 — SEO + content scaling (ongoing)

**Goal**: convert the site into a marketing asset (organic traffic + shareability).

Deliverables:

- Sitemap strategy:
  - include `/shop` and product pages
  - exclude `/admin` completely
- Content:
  - dedicated shop FAQ (shipping/returns/sizing)
  - “How it works” explainer for bookings
  - “Drop” announcements section (optional)

Acceptance criteria:

- Shop pages can rank and convert from search/social

## 6) Proposed technical design (Option A1: Stripe Checkout MVP)

### 6.1 Routes to add

- `src/app/shop/page.tsx` — shop listing
- `src/app/shop/[slug]/page.tsx` — product page (recommended)
- `src/app/shop/success/page.tsx` — post-purchase landing
- `src/app/shop/cancel/page.tsx` — checkout cancelled

### 6.2 APIs to add

- `POST /api/shop/checkout-session`
  - input: `{ productSlug, variant?, quantity }`
  - server maps slug → Stripe Price ID and creates Checkout Session
  - returns `{ url }`
- `POST /api/shop/webhook` (Stripe webhook for Checkout)
  - verifies signature
  - handles:
    - `checkout.session.completed`
    - optionally: `charge.refunded` / `payment_intent.payment_failed` (later)
  - creates/updates `Order` record + sends emails

> Keep booking’s Stripe webhook (`/api/payment/webhook`) separate from shop’s webhook for clarity and risk isolation.

### 6.3 Data model additions (minimal)

Add Prisma models only if you want DB persistence beyond Stripe:

- `Product` (optional; can start in code)
  - `slug`, `name`, `description`, `active`, `stripePriceId`, `imageUrl`, `sortOrder`
- `Order`
  - `id`
  - `stripeCheckoutSessionId` (unique)
  - `stripePaymentIntentId` (optional)
  - `email`
  - `currency`
  - `amountTotal`
  - `status` (`PENDING`, `PAID`, `CANCELLED`, `REFUNDED`, `FULFILLED`)
  - `itemsJson` (snapshot of cart items at purchase time)
  - timestamps

### 6.4 Environment variables (shop)

- `NEXT_PUBLIC_ENABLE_SHOP`
- `STRIPE_WEBHOOK_SECRET_SHOP` (recommended separate secret from booking webhook)
- `SHOP_ADMIN_NOTIFY_EMAIL` (optional; can reuse `ADMIN_EMAIL`)

### 6.5 Suggested folder structure for the shop

- `src/app/shop/` — shop UI routes
- `src/app/api/shop/` — checkout session + webhook
- `src/lib/shop/` — product map + helpers (pure logic)
- `docs/runbooks/` — operational docs (fulfillment, refunds, support)

### 6.6 Runbooks to add (future teammate-friendly ops docs)

- `docs/setup/SHOP_STRIPE_SETUP.md`
  - how to create Stripe Products/Prices
  - how to configure shop webhook endpoint + secret
- `docs/runbooks/SHOP_ORDER_FULFILLMENT.md`
  - how Tripman fulfills orders step-by-step
  - what to do for address issues, returns, chargebacks

## 7) UX/UI guidelines (keep it consistent)

- Reuse current design language:
  - Tripman green accent
  - rounded cards, clean gradients, strong CTA buttons
- Mobile-first:
  - product tiles must be thumb-friendly
  - avoid heavy scripts on homepage
- Performance:
  - lazy-load product images
  - keep homepage shop section lightweight

## 7.1 Tripman brand direction (make it “surprising” but still premium)

Tripman’s brand reads as **high energy + premium + bold + viral** (car karaoke / influencer energy). The site should feel like:

- **Premium**: clean typography, whitespace, high contrast, crisp cards
- **High energy**: motion, punchy CTAs, “drop” style merch presentation
- **Trustworthy**: clear policies, clear pricing, clear checkout, accessible UI

**Design pillars**

- **Tripman Green** is the anchor (already in theme tokens). Everything else supports it.
- **“Night ride” vibe**: subtle dark gradients + neon edge highlights (without going full gamer).
- **Marketing-first layout**: sections must earn attention fast on mobile.

## 7.2 Motion/animation strategy (SUPER COOL, but production-safe)

We want “wow” without slowing booking conversions. That means:

- Prefer **CSS animations** and **GPU-friendly transforms** (`transform`, `opacity`) over expensive layout changes.
- Respect accessibility: support `prefers-reduced-motion` (reduce or disable non-essential animations).
- Keep motion **purposeful**: motion should guide attention to CTAs and reduce confusion.

**Recommended motion tiers**

- **Tier 1 (always on)**: micro-interactions (hover/tap, focus rings, button press, card lift)
- **Tier 2 (scroll-based)**: section reveal animations (fade/slide/scale) with modest duration
- **Tier 3 (hero wow)**: one “signature” effect for Tripman (e.g., animated gradient + spotlight + subtle noise)

**Implementation options**

- **CSS-first (recommended for MVP)**:
  - Use existing Tailwind + `tw-animate-css`
  - Add a small set of custom keyframes (glow, shimmer, marquee, spotlight)
- **Optional upgrade**: Framer Motion
  - Use only on shop pages or isolated components
  - Avoid wrapping the whole app; keep bundles lean

## 7.3 Component-level “cool effects” spec (copy/paste for implementation phase)

### Buttons (primary CTAs)

- Default: green gradient + subtle inner highlight
- Hover: lift `translateY(-1px)` + brighter glow
- Active/tap: press `translateY(1px)` + tighter shadow
- Add a **sheen sweep** on hover (fast, subtle)

### Product cards (shop tiles)

- Idle: premium card with thin border + soft shadow
- Hover/tap:
  - slight tilt or lift
  - animated border glow (green neon edge)
  - image zoom-in 2–4% (transform only)
- Add a **“Drop” badge** for limited releases with pulsing dot (low frequency)

### Section reveals

- Each section appears with `opacity` + `translateY`
- Stagger children (cards) for “premium build” feeling

### Hero / headline treatment

- Two-line headline with a **gradient highlight** on 1–2 words
- Subtle animated background:
  - animated gradient mesh OR spotlight sweep
  - optional subtle noise overlay (static image, not video)

### “Side Hustles” homepage section (marketing punch)

Make this section feel like a mini product launch:

- Title: “Side Hustles” with subcopy like “Limited drops. Tripman energy.”
- A short 3-card row:
  - **Hoodie Drop**
  - **Signature Tee**
  - **Sticker Pack / Accessories**
- Include **social proof** container:
  - “Seen on IG” + latest embed (optional) or curated screenshot strip
- Add “Shop Now” CTA + “Book a ride” secondary CTA (cross-sell)

### Checkout reassurance

Before redirecting to Stripe Checkout:

- show a small trust block:
  - “Secure checkout powered by Stripe”
  - “Fast shipping / returns policy link”

## 7.4 Visual content guidelines (make merch look premium)

- Use consistent photography:
  - neutral background or “night ride” backdrop
  - consistent lighting and crop
- Use 1:1 and 4:5 crops for mobile.
- Prefer WebP/AVIF, lazy-loaded.

## 7.5 Professional polish checklist (small details that matter)

- Keyboard focus states for all interactive elements
- “Loading” skeletons for shop grids
- Toasts for key actions (“Redirecting to checkout…”, “Order confirmed”)
- Empty states that feel branded, not generic

## 7.6 Marketing + conversion copy blocks (ready-to-use tone)

**Homepage Side Hustles headline options**

- “Side Hustles by Tripman”
- “Wear the chaos.”
- “Limited drops. Maximum energy.”

**Subcopy options**

- “Hoodies, tees, and drops inspired by the Tripman Experience.”
- “New releases announced on IG. Grab yours before they’re gone.”

**CTA options**

- Primary: “Shop the Drop”
- Secondary: “Book Your Experience”

## 7.7 Performance constraints (non-negotiable)

- Homepage: keep shop section under a strict JS budget:
  - no heavy animation libraries on the homepage MVP
- Defer all heavy assets to `/shop`.
- Prefer static images over autoplay video backgrounds.

## 8) SEO + content requirements

- `/shop` should have dedicated metadata (title/description)
- Add internal links:
  - homepage → shop
  - shop → booking
- Policies:
  - shipping and returns must be clear (linked from shop pages)

## 9) Testing plan (for execution phase)

Minimum tests:

- Unit: mapping slug → Stripe price id, webhook handler idempotency
- Integration/manual:
  - purchase flow in Stripe test mode
  - webhook receives events and creates order
  - emails sent
- Regression:
  - booking creation + payment still works
  - admin still works

## 9.1 QA checklist for “cool effects” (don’t ship jank)

- Test on low-end mobile (scroll + animations)
- Verify `prefers-reduced-motion`:
  - animations reduced/disabled where possible
- Ensure animations do not move form fields while typing (avoid layout shift)
- Confirm page speed for homepage and scheduler remains strong

## 10) Risks & mitigations

- **Risk**: shop changes slow homepage → lower booking conversions  
  **Mitigation**: keep homepage shop section simple; defer heavy shop assets to `/shop`.
- **Risk**: webhook confusion between booking vs shop  
  **Mitigation**: separate webhook endpoints and secrets.
- **Risk**: inventory/shipping complexity explodes  
  **Mitigation**: start simple; migrate to Shopify if needed.
- **Risk**: secret leakage (already happened)  
  **Mitigation**: rotate immediately; tighten operational practices.

## 11) Immediate next steps (planning output)

To finalize the v1 spec, decide:

- **Checkout**: Stripe Checkout MVP (recommended) vs custom cart
- **Catalog**: hardcoded products vs DB-backed `Product`
- **Fulfillment**: manual fulfillment initially vs platform integrations
- **Domain strategy**: `/shop` (same app) vs `shop.` (separate)

## 12) Design implementation notes (how to build the “wow” later)

When implementing the shop design, prefer:

- Tailwind utilities + a small set of project-level animation classes in `globals.css`
- Reuse existing theme tokens (`--primary`, `--ring`, etc.) so the whole brand stays consistent.

Suggested animation utilities to add (examples):

- `animate-spotlight` (hero background sweep)
- `animate-shimmer` (CTA sheen, skeleton loaders)
- `animate-marquee` (small “drop” ticker line)
- `glow-border` (card border glow on hover)

Accessibility rule:

- Wrap non-essential animations in `@media (prefers-reduced-motion: reduce)` to disable.

## 13) “Super cool” shop page spec (wireframe-level detail)

This section describes **exactly** what the `/shop` experience should feel like.

### 13.1 `/shop` page layout (top → bottom)

- **Shop Hero**
  - Headline: “Side Hustles by Tripman”
  - Subcopy: limited drops + high energy
  - CTA: “Shop the Drop” (scrolls to grid)
  - Secondary CTA: “Book the Experience” (links to `/#events`)
  - Background: animated gradient + spotlight sweep (Tier 3 motion, subtle)
- **Drop ticker (optional)**
  - a thin marquee bar: “LIMITED DROP • TORONTO ENERGY • TRIPMAN APPROVED • …”
- **Featured grid**
  - 2-column (mobile) / 3–4 column (desktop)
  - product cards with:
    - image
    - name
    - price
    - “Buy” button
    - “Drop” badge (limited release)
- **Story block**
  - short brand story: why these items exist + connection to Tripman experience
- **Sizing & shipping**
  - collapsible FAQ-style panels (shipping timeline, returns policy, sizing)
- **IG proof strip**
  - show latest IG embed when available
  - fallback: curated static “as seen on IG” images
- **Footer CTAs**
  - “Shop” + “Book” + “Contact”

### 13.2 Product detail page `/shop/[slug]` (high-conversion template)

- Above the fold:
  - left: large image gallery (simple for v1)
  - right: title, price, short copy, size selector (if used), buy CTA
  - trust block: “Secure checkout by Stripe” + shipping estimate
- Below the fold:
  - “Details” bullets
  - “Fit & sizing” (plain, useful)
  - “Returns” summary + link
  - “You may also like” (2–4 items)

### 13.3 Interaction/motion requirements (what makes it feel premium)

- Page load:
  - skeleton shimmer for product tiles (Tier 1)
- Hover/tap:
  - cards lift + glow border (Tier 1)
- Scroll:
  - sections reveal + stagger (Tier 2)
- Hero:
  - spotlight sweep + subtle background motion (Tier 3)

### 13.4 Accessibility + professionalism requirements

- Every animation must degrade gracefully under `prefers-reduced-motion`.
- Color contrast must remain readable even with glowing effects.
- Avoid flashing effects; keep pulses slow (no seizure risk).

## 14) “Side Hustles” homepage section spec (marketing-first)

### 14.1 Goal

Create a section that:

- instantly communicates “Tripman sells merch”
- makes the drop feel exciting
- does not slow down the booking funnel

### 14.2 Layout (homepage)

- Heading: “Side Hustles”
- Subheading: “Limited drops. Maximum energy.”
- 3 product preview cards (lightweight images)
- CTA row:
  - Primary: “Shop Now”
  - Secondary: “Book Now”
- Optional: social proof capsule “Seen on IG”

### 14.3 Performance rules

- No heavy animation libraries on homepage MVP.
- Defer any “wow” to the `/shop` page where it’s expected.

## 15) Pricing + merchandising strategy (so the site supports revenue)

This is product strategy that can be reflected in UI and analytics.

### 15.1 Drop structure (recommended)

- 1 hero item with higher margin (hoodie)
- 1 mid item (tee)
- 1 impulse item (stickers)

### 15.2 Bundles (high ROI)

- Bundle products in Stripe as separate “bundle price” (v1-friendly)
- Show a bundle card: “Hoodie + Tee — save $X”

### 15.3 Scarcity without being cringe

- If inventory is actually limited, show:
  - “Limited drop” badge
  - “Restock soon” message (manual)
- Avoid fake countdowns unless real.

## 16) Concrete MVP decisions (write these before coding)

Fill this out for v1:

- **Checkout**: Stripe Checkout (yes/no)
- **Catalog source**: Code list / DB Product table / Stripe products only
- **Variants**: none / sizes only / sizes+colors
- **Shipping**: flat rate / free over threshold / calculated
- **Returns**: no returns / 14 days / 30 days (and the policy link)
- **Domain**: `/shop` vs `shop.` subdomain

## 17) Linking + navigation plan (connecting one-page booking + multi-page shop)

This upgrade changes the information architecture from “only one page” to:

- **Home (one-page booking marketing)**: `/` with sections (About, Packages, Scheduler, FAQ, Contact)
- **Shop (multi-page)**: `/shop`, `/shop/[slug]`, `/shop/success`, `/shop/cancel`
- **Booking details**: `/booking/[id]`
- **Admin**: `/admin/*` (private)

The goal is to keep the original “one-page funnel” feeling, while making the shop feel like a real, premium area.

### 17.1 Primary navigation (global header)

The existing header should become a true **global nav** that works on both `/` and `/shop/*`.

**Nav items (recommended)**

- **Home** → `/`
- **About** → `/#about`
- **Book** → `/#events` (scrolls to scheduler on the homepage)
- **Side Hustles** → `/shop`
- **FAQ** → `/#faq`
- **Contact** → `/#contact`

**CTA buttons (recommended)**

- Primary CTA on home: **“Book Now”** (scroll to `/#events`)
- Primary CTA on shop: **“Shop the Drop”** (scroll to grid) or **“Checkout”** if cart exists later
- Secondary CTA across site: **“Book the Experience”** (always available, links to `/#events`)

### 17.2 How links behave (rules)

We want links to feel smooth and predictable:

- **In-page section jumps** (on `/`):
  - Use anchor links: `/#about`, `/#events`, `/#faq`, `/#contact`
  - Ensure each section has a stable `id="about"` etc.
  - Keep smooth scroll enabled (already done in CSS for mobile)

- **Cross-route section jumps** (from `/shop/*` back to booking section):
  - Link to `/#events` (this loads the homepage and then scrolls to the scheduler anchor)
  - Same for `/#contact`, `/#faq`, etc.

- **From booking funnel to shop**:
  - Homepage “Side Hustles” section CTA links to `/shop`
  - Booking success UI may show a subtle “Limited drop” merch CTA → `/shop`

- **From shop to booking**:
  - Add a persistent secondary CTA in shop header/footer: “Book the Experience” → `/#events`

### 17.3 Active states (so users know where they are)

On desktop and mobile menus:

- **Route-level active state**:
  - If path starts with `/shop`, highlight **Side Hustles**
  - If path starts with `/admin`, highlight nothing (or hide nav items)
- **Section-level active state** (optional, nice-to-have):
  - On the homepage `/`, use IntersectionObserver to highlight the current section in the nav (About/Book/FAQ/Contact)

### 17.4 Mobile navigation (important for conversion)

Mobile menu should be simple:

- Hamburger opens a sheet/dialog
- Tapping an anchor link:
  - navigates (if needed)
  - scrolls to section
  - closes the menu immediately

Touch UX:

- Keep large tap targets (already supported by CSS)
- Keep CTA button visible (sticky header)

### 17.5 Footer navigation (backup navigation + SEO)

Footer should include:

- Booking links: About, Book, FAQ, Contact
- Shop links: Shop, Shipping & Returns, Size Guide (if separate)
- Legal: Terms, Privacy

### 17.6 URL strategy (professional + shareable)

Keep URLs clean and social-friendly:

- `/` for the booking/brand landing
- `/shop` for the shop landing
- `/shop/[slug]` for products (shareable on IG stories / links)
- `/booking/[id]` for customer booking details (email verification already enforced)

### 17.7 SEO + sitemap implications

- Include `/shop` and `/shop/[slug]` in sitemap (once shop is enabled)
- Exclude `/admin/*` from sitemap and add `noindex` on admin pages

### 17.8 Feature flags (safe rollout)

Use `NEXT_PUBLIC_ENABLE_SHOP` to control:

- Whether the nav shows “Side Hustles”
- Whether the homepage shows the “Side Hustles” section
- Whether `/shop` routes are accessible (or show “Coming soon”)
