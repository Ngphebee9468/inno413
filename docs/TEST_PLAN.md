# Test Plan — inno413

## Success Scenario (end-to-end)
1. Open homepage (no login) → confirm 4 seed orders visible in order list.
2. Click "Start Order" → multi-step form loads (Step 1 shows materials from DB).
3. Select "Dry-Fit", pick blue (#003087), choose "Front" print zone → 3D shirt updates colour live.
4. Enter sizes: M×20, L×20, XL×10 → completeness bar shows ≥80%.
5. Upload a PNG design file → upload progress shown, success state confirmed.
6. Set delivery date 5 days out → `urgent` tag appears.
7. Submit form → Stripe Checkout opens in test mode.
8. Complete payment with card `4242 4242 4242 4242` → redirect to success page with order ID.
9. Check Supabase: `orders` row has `status=submitted`, `deposit_paid=correct amount`, `order_items` has 3 rows.
10. Open `/admin` → new order appears at top (sorted by urgency).
11. Click order → all fields correct; update status to `in_production` → row updates instantly.
12. Click "Send Invoice" → confirm modal → Edge Function called → Stripe invoice created → test email received.
13. Pay balance via invoice link → order status updates to `delivered`.
14. Check `audit_logs` → entries for deposit payment, status changes, invoice send.

## Empty / Error Cases
- Submit form with no sizes added → validation error: "Add at least one size and quantity."
- Upload a file > 10MB → error toast: "File must be under 10MB."
- Stripe payment cancelled → order NOT inserted; customer returned to form with warning.
- Stripe webhook with invalid signature → Edge Function returns 400, no DB write.
- Staff `/admin` accessed without passphrase → redirect to staff login.
- 3D model fails to load (WebGL off) → flat preview image shown, no blank screen.
- Network error during form submit → error toast, form data preserved, retry button shown.
