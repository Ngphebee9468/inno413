# Architecture — inno413

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Three.js (3D preview)
- **Backend/DB:** Supabase (Postgres + Storage + RLS)
- **Payments:** Stripe (Checkout for deposit; invoices for balance)
- **Hosting:** Vercel

## Now vs Later
**Now:** order submission form, 3D preview widget, material selector, file upload to Supabase Storage, deposit checkout, staff order dashboard, status updates.
**Later:** customer login + order history, AI design suggestion, automated invoice generation, delivery tracking integration.

## Key User Action — Step by Step
1. Customer opens homepage → sees live demo orders (seed data) and "Start Order" CTA.
2. Fills multi-step form: material → design service → colours/sizes → upload → delivery details.
3. 3D preview renders in real-time as options are selected (Three.js shirt mesh + texture overlay).
4. Customer clicks "Submit & Pay Deposit" → Stripe Checkout opens for 30% of quoted price.
5. On payment success, Supabase row `orders.status` set to `submitted`; confirmation email sent.
6. Staff opens `/admin` → views order list → opens detail → updates status at each stage.
7. Staff marks order `ready` → triggers balance invoice link sent to customer email.
8. Customer pays balance via Stripe; order marked `delivered` or `collected`.

## Layer Plan
1. **Data layer first** — tables, constraints, RLS, seed data.
2. **App logic** — form → DB → status machine → Stripe webhooks.
3. **Smart features later** — AI design scoring, auto-quote engine.

The platform works fully without any AI: every status, payment, and order detail is driven by form inputs, database rows, and Stripe events.
