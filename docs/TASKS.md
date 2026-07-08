# Tasks — inno413

## Sprint 1 — DB Foundation + Seed Data (Days 1–2)
**Goal:** Database live, realistic demo rows visible without login.
- [ ] Run migration SQL: create `tshirt_materials`, `orders`, `order_items`, `payments`, `audit_logs`
- [ ] Seed 4 materials, 4 demo orders, 8 order_items, 2 payments
- [ ] Enable RLS with v1 permissive policies on all tables
- [ ] Confirm Supabase Storage bucket `design-files` created with public read, authenticated write
- [ ] Deploy to Vercel; confirm `/` renders seed data (not a login page)

**Definition of Done:** Visiting the live URL shows a homepage with real-looking order data from the DB. No login required.

---

## Sprint 2 — Order Submission Form + Core Engine (Days 3–5) ✦ v1 functional milestone
**Goal:** End-to-end order creation works against the DB.
- [ ] Multi-step form: Step 1 material selector (from DB), Step 2 design service + colour picker + print zone, Step 3 size/quantity table (add rows per size), Step 4 file upload to Supabase Storage, Step 5 delivery details
- [ ] Completeness score bar shown to customer (rule-based)
- [ ] `urgent` tag auto-applied if delivery_date < 7 days
- [ ] On submit: insert `orders` + `order_items` rows; return order ID
- [ ] All five form states handled: loading spinner, empty field validation, partial save, error toast, success confirmation
- [ ] Staff `/admin` dashboard: lists all orders from DB, sortable by date/urgency/status
- [ ] Staff order detail page: all fields displayed, status dropdown to update

**Definition of Done:** A tester fills the form, submits, sees a confirmation with order ID, and the staff dashboard shows the new row with correct details.

---

## Sprint 3 — 3D Preview Widget (Days 6–8)
**Goal:** Customers can visualise their shirt before submitting.
- [ ] Integrate Three.js shirt mesh (GLTF model) on the order form page
- [ ] Shirt colour updates in real-time as customer picks hex colour
- [ ] Print zone overlay (front/back/both) shown as texture placeholder
- [ ] Continuous slow rotation animation (auto-rotating OrbitControls)
- [ ] Fallback: if WebGL unsupported, show static flat preview image
- [ ] All states: loading skeleton, model-load error, ready

**Definition of Done:** Changing colour and print zone in the form updates the 3D model live. Works on Chrome/Safari desktop without login.

---

## Sprint 4 — Stripe Deposit Payment (Days 9–11)
**Goal:** Customer pays 30% deposit at order submission.
- [ ] Stripe Checkout session created via Supabase Edge Function `create_checkout_session` (order_id, amount)
- [ ] Stripe webhook Edge Function `handle_stripe_webhook` verifies signature, updates `orders.deposit_paid` and `orders.stripe_session_id`, inserts `payments` row, writes `audit_logs`
- [ ] Order status set to `submitted` only after confirmed payment webhook
- [ ] Success/cancel redirect pages with order summary
- [ ] Publishable key only in frontend env; secret key only in Edge Function env

**Definition of Done:** Tester completes Stripe test checkout → order row shows `deposit_paid` amount → payment row exists → audit log entry written.

---

## Sprint 5 — Invoice & Balance Payment (Days 12–14)
**Goal:** Staff sends invoice; customer pays balance.
- [ ] Staff detail page: "Send Invoice" button → calls Edge Function `create_stripe_invoice` (high-risk, requires staff confirmation modal)
- [ ] Edge Function creates Stripe Invoice, stores `stripe_invoice_id` on order
- [ ] Customer receives email with Stripe-hosted invoice link
- [ ] Webhook updates `orders.balance_paid`, status → `delivered` or `collected`
- [ ] Audit log entry for invoice send + payment receipt

**Definition of Done:** Staff clicks Send Invoice → customer email received (Stripe test mode) → customer pays → order status updates in dashboard.

---

## Sprint 6 — Lock It Down (Days 15–17)
**Goal:** Real users can create accounts; data is owner-scoped.
- [ ] Supabase Auth enabled; sign-up/login pages added
- [ ] `orders.user_id` populated on submit for logged-in customers
- [ ] Replace v1 permissive RLS with owner-scoped policies (`auth.uid() = user_id`)
- [ ] `/admin` protected by staff role check (Supabase custom claim or env passphrase → proper role)
- [ ] Customer order history page (`/my-orders`) — lists own orders only
- [ ] Confirm no order data leaks between customers in manual test

**Definition of Done:** Customer A cannot see Customer B's orders. Staff can see all. Anonymous visitors see only seed demo rows.

---

## Gantt (Sprint → Days)
| Sprint | Days |
|---|---|
| 1 DB Foundation | 1–2 |
| 2 Order Form + Engine | 3–5 |
| 3 3D Preview | 6–8 |
| 4 Stripe Deposit | 9–11 |
| 5 Invoice & Balance | 12–14 |
| 6 Lock It Down | 15–17 |
