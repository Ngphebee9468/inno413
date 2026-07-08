# Security — inno413

## Secret Handling
- `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — server-side env vars only, never imported in any client component.
- Stripe Checkout sessions created exclusively in Next.js API routes (`/api/stripe/*`).
- Supabase anon key is safe for frontend; service role key is never exposed.

## Permission Model
- **v1 (demo):** RLS policies allow public read + write on all domain tables so the app is demoable without login.
- **Lock-down sprint:** Replace all v1 policies with `auth.uid() = user_id`. Staff get elevated access via a `role` claim set in Supabase Auth metadata — never trusted from the client.
- Customers can only read/write their own orders after lock-down.
- Staff role checked server-side in API routes before any write that customers should not perform.

## Approved Tools Rule
- No `eval`, `exec`, or dynamic SQL construction.
- Agent actions use the named tools list only (see AGENTIC_LAYER.md).
- Every tool call that mutates data writes a row to `activities` before returning.

## Audit Principle
- Every status change, payment event, and invoice action is logged in `activities` with actor + timestamp + before/after metadata.
- Logs are append-only (no update/delete policy on `activities` even for staff).
- If a Stripe webhook fails to write to DB, the order remains in its previous state — no silent partial updates.

## Stop and Get Help
- Refund logic, PCI scope questions, and data-deletion requests (PDPA/GDPR) require a human engineer review before any code ships.
