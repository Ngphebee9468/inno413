# Agentic Layer — inno413

## Risk Levels & Actions

### Low — Auto (no approval needed)
- Generate `ai_summary` after order submitted (tag/summarise only)
- Flag urgency and completeness score on new orders
- Auto-generate `reference_code` and `invoice_number`

### Medium — Light staff approval before execution
- Update `order_status` from pending → in_review (staff clicks confirm)
- Send order-received acknowledgement email to customer
- Mark deposit as waived (staff must tick confirm checkbox)

### High — Staff approval required every time
- Issue invoice and send payment link to customer email
- Trigger Stripe payment session for final balance
- Mark order as Delivered (irreversible in billing context)

### Critical — Human only, no agent
- Issue refund via Stripe
- Delete order record
- Modify invoice amount after issued

## Named Tools (approved list)
- `create_stripe_checkout_session` — server-side API route only, never called from client
- `send_transactional_email` — via Resend/SendGrid; only on approved trigger events
- `update_order_status` — validates allowed transitions before writing
- `generate_ai_summary` — calls OpenAI, stores result as unreviewed

## Audit Log Fields (activities table)
- `entity_type`, `entity_id`, `action`, `actor`, `metadata` (before/after), `created_at`

## v1 vs Later
- **v1:** Low-risk auto actions only; all medium/high are manual staff clicks with DB writes logged.
- **Later:** Automated email triggers on status change; AI summary auto-generation on submit.
