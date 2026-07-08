# Test Plan — inno413

## Primary Success Scenario (run after Sprint 6)

1. **Homepage loads** — visit `/`; confirm 4 demo order cards visible, no login prompt, statuses correct.
2. **Start new order** — click "New Order"; confirm multi-step form opens on Step 1.
3. **3D preview** — select "Jersey", pick colour "Navy Blue", enter number "10"; confirm model updates in real time.
4. **Upload design** — attach a PNG file; confirm thumbnail appears on model as decal.
5. **Design service** — select "Design from scratch"; add note "Football league jerseys".
6. **Material** — select "Dry-Fit"; confirm selection persists to next step.
7. **Size breakdown** — enter S×4, M×8, L×6, XL×4; confirm total = 22.
8. **Delivery** — enter address, select delivery, pick a date 10 days out.
9. **Review & submit** — review step shows all entries; click "Submit & Pay Deposit".
10. **Stripe deposit** — Stripe Checkout opens; pay with test card `4242 4242 4242 4242`; confirm redirect to success page with reference code.
11. **DB check** — open Supabase Studio; confirm `orders` row exists with `deposit_status = 'paid'`; confirm `order_line_items` rows; confirm `activities` row with action `deposit_paid`.
12. **Staff dashboard** — visit `/staff`; confirm new order appears at top with urgency badge.
13. **Status update** — click order → detail page; change status to "In Production"; save; confirm badge updates on dashboard and DB row changed.
14. **Create invoice** — click "Create Invoice"; enter total 880.00; deposit 100.00 auto-deducted; balance_due = 780.00; save.
15. **Payment link** — copy link; open in new tab; pay with test card; confirm redirect to payment success.
16. **Final DB check** — `invoices.payment_status = 'paid'`; `paid_at` populated; activity log row present.
17. **Mark delivered** — staff updates status to "Delivered"; confirm DB updated.

## Empty State Tests
- Visit `/staff` with all orders filtered out → "No orders found" message displayed (not a blank page).
- Start order form, skip design upload → proceed without file; confirm form validation shows warning but does not hard-block.

## Error State Tests
- Upload a 20MB file → confirm error message "File too large, max 10MB" shown without crash.
- Stripe Checkout: cancel payment → return to order form with "Payment cancelled, your order is saved" message; `deposit_status` remains `unpaid`.
- Submit order form with missing required field (customer email) → inline validation error shown; no DB write attempted.

## Security Smoke Tests (after Sprint 7)
- Log in as Customer A; attempt to fetch Customer B's order by direct URL (`/orders/[id]`) → 403 or redirect.
- Confirm `STRIPE_SECRET_KEY` is not present in any client-side bundle (check Network tab → no secret in JS files).
- Confirm `activities` table has no delete button exposed in staff UI.
