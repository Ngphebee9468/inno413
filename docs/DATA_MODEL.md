# Data Model — inno413

## tshirt_materials
| Field | Type |
|---|---|
| id | uuid PK |
| name | text (e.g. "Dry-Fit", "Anti-Bacterial") |
| description | text |
| price_modifier_pct | numeric (surcharge %) |
| is_active | boolean |
| created_at | timestamptz |

## orders
| Field | Type |
|---|---|
| id | uuid PK |
| user_id | uuid (nullable, owner-scoped later) |
| customer_name | text |
| customer_email | text |
| design_service | text — enum: `redesign`, `from_scratch`, `slight_modification`, `use_as_is` |
| design_notes | text |
| design_file_url | text (Supabase Storage) |
| material_id | uuid FK → tshirt_materials |
| shirt_colour | text (hex) |
| print_zone | text — enum: `front`, `back`, `both`, `full_wrap` |
| delivery_date | date |
| delivery_type | text — enum: `delivery`, `collection` |
| delivery_address | text |
| status | text default `submitted` |
| quoted_price | numeric |
| deposit_paid | numeric |
| balance_paid | numeric |
| stripe_session_id | text |
| stripe_invoice_id | text |
| created_at | timestamptz |

## order_items (per-size line)
| Field | Type |
|---|---|
| id | uuid PK |
| order_id | uuid FK → orders |
| size | text (XS/S/M/L/XL/XXL/custom) |
| quantity | integer |
| created_at | timestamptz |

## payments
| Field | Type |
|---|---|
| id | uuid PK |
| order_id | uuid FK → orders |
| user_id | uuid nullable |
| amount | numeric |
| payment_type | text — enum: `deposit`, `balance` |
| stripe_payment_intent_id | text |
| status | text |
| created_at | timestamptz |

## audit_logs
| Field | Type |
|---|---|
| id | uuid PK |
| actor | text (email or "system") |
| action | text |
| object_type | text |
| object_id | uuid |
| payload | jsonb |
| created_at | timestamptz |

## AI Fields (design_suggestion on orders)
| Field | Type |
|---|---|
| ai_design_suggestion | text |
| ai_design_suggestion_source | text |
| ai_design_suggestion_confidence | numeric |
| ai_design_suggestion_review_status | text default `unreviewed` |

## RLS
All tables: RLS enabled. v1 permissive policies (select/all = true). Lock-down sprint replaces with `auth.uid() = user_id`.
