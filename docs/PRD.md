# PRD — inno413 T-Shirt Order Platform

## Problem
Customers struggle to communicate custom t-shirt requirements clearly, and staff waste time chasing incomplete briefs, delayed designs, and unconfirmed payments.

## Target Users
- **Customers** — individuals or teams ordering custom apparel.
- **Company staff / admin** — inno413 team receiving, processing, and invoicing orders.

## Core Objects
- `material_types` — available fabrics (dry-fit, anti-bacterial, etc.)
- `orders` — one order per customer request; holds all brief, design, delivery, and payment data
- `order_line_items` — per-size quantities within an order
- `invoices` — final billing record linked to an order
- `activities` — audit trail of every status change and action

## MVP Must-Haves
- [ ] Multi-step order form: design upload, design service choice, material picker, size/qty breakdown, delivery details
- [ ] Real-time 3D rotating garment preview (colour, text, decal)
- [ ] Stripe deposit checkout on order submit
- [ ] Staff dashboard: view all orders, update status, add notes
- [ ] Staff invoice creation + customer payment link for remaining balance
- [ ] All data persists to Supabase; UI reflects DB truth on reload

## Non-Goals (v1)
- Customer account login / order history portal
- Inventory / stock management
- Automated AI design generation
- Multi-currency or tax calculation

## Success Criteria
A customer visits the site, completes the 5-step order form with a design file, selects Dry-Fit Navy Blue jersey with size breakdown, pays a deposit via Stripe, and receives a reference number. Staff open the dashboard, see the order, update status to In Production, then issue an invoice. Customer pays the balance via the payment link. Staff marks the order Delivered. Every step is reflected in the database with no manual workaround needed.

## Definition of Done
The above scenario runs end-to-end on the live Vercel deployment against the real Supabase database, with no dead buttons, no seed-data-only screens, and correct DB writes confirmed after every action.
