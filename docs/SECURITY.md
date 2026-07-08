# Security — inno413

## Secret Handling
- Stripe secret key and Supabase service-role key live ONLY in Vercel environment variables / Supabase Edge Function secrets.
- Frontend receives only Stripe publishable key and Supabase anon key.
- Design file uploads go directly to Supabase Storage via signed URLs — never through the Next.js server.

## Permission Model
- **v1 (demo):** Permissive RLS policies — all rows readable/writable without login so the app is demoable.
- **Lock-down sprint:** Customer rows scoped to `auth.uid() = user_id`; staff routes protected by a `role = 'staff'` check in Supabase `profiles` or a secret admin header.
- `/admin/*` routes: middleware checks for a staff session before rendering — even in v1, the admin path requires an env-gated passphrase to avoid public exposure.

## Approved-Tools Rule
Agents may only call named Edge Functions (listed in AGENTIC_LAYER.md). No function may accept a raw SQL string from the client. All mutations validate input shape with Zod before touching the DB.

## Audit Principle
Every meaningful mutation (status change, payment event, invoice send) writes to `audit_logs` with actor + payload. Logs are append-only (no delete policy on `audit_logs`). Stripe webhook events are stored raw in `payments` before processing.

## Payments
Stripe Checkout handles all card data — inno413 never touches raw card numbers. Webhook signature verification is mandatory before any order status update.
