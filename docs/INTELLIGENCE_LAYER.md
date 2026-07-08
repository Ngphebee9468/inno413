# Intelligence Layer — inno413

## Messy Inputs
- Free-text design notes ("make it look sporty, blue, with number 10")
- Uploaded images of varying quality/format
- Vague size requests ("some larges and mediums")

## Auto-Structure Schema (v1 → later)
```json
{
  "order_id": "uuid",
  "parsed_colours": ["#003087", "#FFFFFF"],
  "detected_design_style": "sports_jersey",
  "recommended_material": "Dry-Fit",
  "confidence": 0.82,
  "source": "gpt-4o-vision",
  "review_status": "unreviewed"
}
```

## Events to Track
- Order submitted (with design service type)
- Design file uploaded
- 3D preview colour/material changed (frequency)
- Deposit paid
- Status transition timestamps
- Balance paid

## Scoring Rules (rule-based first)
- **Complexity score** = design_service weight + size_variants count + print_zone multiplier → used to suggest base price.
- **Urgency flag** = delivery_date < 7 days → auto-tag `urgent`.
- **Completeness score** = % of required fields filled → shown to customer before submit.

## What Gets Ranked
- Orders by urgency + delivery date on staff dashboard.
- Materials by popularity (order count).

## v1 vs Later
**v1:** Rule-based completeness score, urgency flag, complexity-based quote estimate.
**Later:** GPT-4o vision reads uploaded design → suggests colours/material; AI drafts a design brief summary for staff.
