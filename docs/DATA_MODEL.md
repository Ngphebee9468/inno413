# Data Model — inno413

## material_types
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable, owner-scope at lock-down |
| name | text | e.g. Dry-Fit |
| description | text | |
| slug | text unique | url-safe key |
| created_at | timestamptz | |

## orders
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable until auth sprint |
| reference_code | text unique | auto-generated |
| customer_name | text | |
| customer_email | text | |
| customer_phone | text | |
| design_service | text | enum: use_mine / redesign_mine / from_scratch / slight_modification |
| design_file_url | text | Supabase Storage URL |
| design_notes | text | |
| material_type_id | uuid FK → material_types | |
| garment_type | text | tshirt / jersey / polo / hoodie |
| base_colour | text | hex or colour name |
| preview_config | jsonb | saved 3D config snapshot |
| delivery_address | text | |
| delivery_method | text | deliver / self_collect |
| needed_by | date | |
| total_quantity | int | sum of line items |
| deposit_amount | numeric | |
| deposit_status | text | unpaid / paid / waived |
| stripe_deposit_session_id | text | |
| order_status | text | pending / in_review / in_production / ready / delivered / cancelled |
| staff_notes | text | |
| ai_summary | text | **AI field** |
| ai_summary_source | text | model name / prompt version |
| ai_summary_confidence | numeric | 0–1 |
| ai_summary_review_status | text | unreviewed / approved / rejected |
| created_at | timestamptz | |

## order_line_items
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| order_id | uuid FK → orders | cascade delete |
| size | text | XS / S / M / L / XL / XXL |
| quantity | int | |
| unit_price | numeric | optional, set by staff |
| colour | text | per-size colour override |
| custom_text | text | jersey number or name for this size batch |
| created_at | timestamptz | |

## invoices
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| order_id | uuid FK → orders | |
| invoice_number | text unique | auto-generated |
| subtotal | numeric | |
| deposit_paid | numeric | |
| balance_due | numeric | |
| payment_status | text | outstanding / paid / partial / waived |
| stripe_payment_session_id | text | |
| notes | text | |
| issued_at | timestamptz | |
| paid_at | timestamptz | |
| created_at | timestamptz | |

## activities
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| entity_type | text | orders / invoices / etc. |
| entity_id | uuid | |
| action | text | e.g. status_changed / deposit_paid |
| actor | text | staff email or 'customer' |
| metadata | jsonb | before/after values |
| created_at | timestamptz | |

## RLS
- v1: all tables open (select + all) for demo.
- Lock-down sprint: replace with `auth.uid() = user_id`; staff role gets policy exception via a `staff_emails` lookup or Supabase custom claims.
