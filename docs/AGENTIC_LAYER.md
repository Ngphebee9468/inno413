# Agentic Layer — inno413

## Risk Levels & Actions

### Low — Auto (no approval needed)
- Tag order as `urgent` when delivery_date < 7 days. *(tool: `tag_order`)*
- Calculate completeness score and show inline warning to customer. *(tool: `score_completeness`)*
- Parse design notes to pre-fill colour hex suggestion. *(tool: `parse_design_notes`)*

### Medium — Light Approval (staff confirms)
- Update order status (e.g. `in_review → in_production`). *(tool: `update_order_status`)*
- Generate quoted price from complexity score. *(tool: `generate_quote`)*

### High — Always Approval (staff explicitly triggers)
- Send balance invoice link to customer email. *(tool: `send_invoice_email`)*
- Initiate Stripe invoice. *(tool: `create_stripe_invoice`)*

### Critical — Human Only
- Issue refund to customer. *(human action via Stripe dashboard)*
- Delete an order record. *(human action, no automated tool)*
- Any legal/dispute escalation.

## Audit Log Fields
`actor`, `action`, `object_type`, `object_id`, `payload (jsonb)`, `created_at`

Every tool call writes one audit_log row before and after execution.

## Named Tools Only
No `run_any` or `send_any`. Each tool is a named Supabase Edge Function with a fixed input/output schema.

## v1 vs Later
**v1:** `tag_order`, `score_completeness`, `update_order_status` (manual button).
**Later:** `parse_design_notes` (GPT-4o), `generate_quote` (AI), `send_invoice_email` (automated trigger).
