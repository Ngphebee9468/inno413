# Architecture — inno413

## Stack
- **Frontend:** Next.js 14 (App Router) on Vercel
- **Backend/DB:** Supabase (Postgres + Storage + Auth)
- **Payments:** Stripe Checkout (server-side API routes only)
- **3D Preview:** Three.js / React Three Fiber

## Build Sequence
**Now:** Domain tables → order form CRUD → 3D preview → Stripe deposit → staff dashboard → invoice + final payment
**Next:** Customer auth + order history, email notifications, PDF invoices
**Later:** AI design suggestions, inventory, analytics

## Key User Action — Order Submission Flow
1. Customer opens homepage (demo orders visible, no login required).
2. Clicks "New Order" → multi-step form.
3. Uploads design file → stored in Supabase Storage; URL saved to `orders.design_file_url`.
4. Selects material, garment type, colours, adds text/number → previews on 3D model in real time.
5. Enters size breakdown → written to `order_line_items`.
6. Enters delivery address and deadline → saved to `orders`.
7. Submits → Next.js API route creates Stripe Checkout session for deposit.
8. Stripe redirects back → webhook updates `orders.deposit_status = 'paid'` and logs to `activities`.
9. Staff dashboard auto-reflects new order.
10. Staff updates status, creates invoice → customer pays balance via second Stripe session.

## Layer Plan
1. **Data layer first** — tables, constraints, RLS (open for demo, locked per-user later).
2. **App logic** — form, storage, status machine, Stripe integration.
3. **Smart features** — AI order summary, auto-tagging urgency (layered on top; core works without them).

## Core Without AI
All order capture, status updates, invoicing, and payments work via plain CRUD + Stripe. AI fields are optional overlays that can be switched off.
