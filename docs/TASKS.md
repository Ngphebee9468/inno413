# Tasks & Sprints — inno413

## Sprint 1 — Database & seed data (demo-first)
**Goal:** All tables exist; seed data renders on homepage without any login.
- [ ] Run migration SQL in Supabase (all tables, RLS v1 open policies)
- [ ] Seed material_types (4 rows), orders (4 demo rows), order_line_items, invoices
- [ ] Build homepage `/` — read orders from Supabase, display order cards with status badges
- [ ] Loading, empty, and error states on homepage order list
- [ ] Verify: anonymous visitor sees demo orders on first load

**Definition of Done:** Visiting the deployed URL shows at least 4 demo orders with correct statuses, no login prompt, data sourced from Supabase (not hardcoded).

---

## Sprint 2 — Order submission engine ✦ v1 core
**Goal:** A real order can be created and saved end-to-end.
- [ ] Multi-step form (5 steps): design brief → material/type → size breakdown → delivery → review
- [ ] Design file upload to Supabase Storage; URL saved to `orders.design_file_url`
- [ ] Size/qty rows written to `order_line_items`
- [ ] `total_quantity` computed and saved
- [ ] Submission confirmation screen shows `reference_code`
- [ ] Loading, validation error, upload error, success states on every step
- [ ] New order appears on homepage after submit

**Definition of Done:** Submit a form with a PNG upload → row in `orders` + rows in `order_line_items` confirmed in Supabase Studio; reference code shown on screen.

---

## Sprint 3 — 3D garment preview
**Goal:** Customer sees their garment update live as they configure it.
- [ ] Embed Three.js rotating t-shirt/jersey model on step 1 of order form
- [ ] Colour picker updates model texture in real time
- [ ] Text/number field overlays on model
- [ ] Design upload thumbnail appears as decal on model
- [ ] `preview_config` JSON snapshot saved with order on submit
- [ ] Fallback: static image if WebGL not available

**Definition of Done:** Changing colour, entering a number, and uploading an image all visibly update the rotating model without page reload.

---

## Sprint 4 — Deposit payment (Stripe)
**Goal:** Customer pays deposit; DB reflects payment.
- [ ] API route `POST /api/stripe/deposit` creates Checkout session (amount from `orders.deposit_amount`)
- [ ] Stripe public key only on client; secret key server-side only
- [ ] Stripe webhook `POST /api/stripe/webhook` updates `deposit_status = 'paid'` and logs to `activities`
- [ ] Success/cancel redirect pages with clear copy
- [ ] Test with Stripe test card 4242 4242 4242 4242

**Definition of Done:** Test order deposit → Stripe test succeeds → `orders.deposit_status` = 'paid' in DB confirmed in Studio; `activities` row present.

---

## Sprint 5 — Staff order dashboard ✦ v1 functional milestone
**Goal:** Staff can manage all incoming orders.
- [ ] `/staff` dashboard — table of all orders, sortable by urgency + date
- [ ] Order detail page: all fields, design file preview, size breakdown table
- [ ] Status update dropdown (allowed transitions only) + save → writes to DB + logs activity
- [ ] Staff notes field, editable and persisted
- [ ] "Mark deposit received" button for offline payments
- [ ] Loading, empty (no orders yet), error states

**Definition of Done:** Staff updates order status in dashboard → DB row updated → reload confirms new status; activity log row present.

---

## Sprint 6 — Invoice & final payment
**Goal:** Staff issues invoice; customer pays remaining balance.
- [ ] "Create Invoice" form on order detail page (total, deposit deducted, notes)
- [ ] `invoices` row written; `balance_due` computed
- [ ] API route `POST /api/stripe/invoice` creates Checkout session for balance
- [ ] Customer payment link displayed to staff (copy-to-clipboard)
- [ ] Stripe webhook updates `invoices.payment_status = 'paid'` + logs activity
- [ ] Staff dashboard shows paid vs outstanding invoice badges

**Definition of Done:** Staff creates invoice → payment link works in Stripe test mode → `invoices.payment_status` = 'paid' confirmed in DB after test payment.

---

## Sprint 7 — Lock it down (auth + per-user RLS)
**Goal:** Real customers log in; data is isolated correctly.
- [ ] Supabase Auth: email/password sign-up and login pages
- [ ] `user_id` populated on order submit for logged-in users
- [ ] Replace all v1 open RLS policies with `auth.uid() = user_id` for customers
- [ ] Staff role via Supabase custom claim; staff API routes validate claim server-side
- [ ] Customer order history page (own orders only)
- [ ] Verify: user A cannot query user B's orders

**Definition of Done:** Two test accounts created; each sees only their own orders; staff account sees all; confirmed via direct Supabase client queries.

---

## Sprint 8 — Notifications & polish
**Goal:** Customers informed automatically; app is production-ready.
- [ ] Email on: order received, status → in_production, invoice issued (via Resend)
- [ ] Customer order status timeline page
- [ ] PDF invoice download (React PDF or server-rendered)
- [ ] Audit all screens for empty/error/loading states
- [ ] Full end-to-end manual test (see TEST_PLAN.md)

**Definition of Done:** Full success scenario in TEST_PLAN.md passes on live deployment with real Stripe test mode and real email delivery.

---

## Gantt (sprint → feature)
```
Sprint 1  | DB schema, seed data, homepage order list
Sprint 2  | Order submission form + file upload            ← core engine
Sprint 3  | 3D garment preview
Sprint 4  | Stripe deposit payment
Sprint 5  | Staff dashboard + status management            ← v1 functional ✦
Sprint 6  | Invoice creation + final payment
Sprint 7  | Auth + RLS lock-down
Sprint 8  | Emails, PDF, polish
```
