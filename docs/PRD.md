# PRD — inno413 T-Shirt Order Platform

## Problem
Customers struggle to communicate t-shirt specs clearly; staff waste time chasing missing details. Finalising designs takes too long because customers can't visualise the result upfront.

## Target Users
- **Customer** — individual or group buyer placing a t-shirt order.
- **Staff** — inno413 team member reviewing, printing, and fulfilling orders.

## Core Objects
`orders`, `order_items` (per size/qty line), `design_requests`, `tshirt_materials`, `payments`, `users`

## MVP Must-Haves
- [ ] Customer submits an order: design brief, design service type, per-size quantities, delivery date + address
- [ ] Customer uploads a design file (or notes "design from scratch")
- [ ] Customer selects t-shirt material from a predefined list
- [ ] 3D rotating shirt preview that reflects chosen colour, design type, and print zone
- [ ] Customer pays a deposit via Stripe at order submission
- [ ] Staff dashboard: list all orders, view full details, update order status
- [ ] Staff sends invoice; customer pays remaining balance via Stripe
- [ ] Order status flow: `submitted → in_review → in_production → ready → delivered/collected`

## Non-Goals (v1)
- Multi-store / multi-brand tenancy
- Automated print-file generation
- Live chat / messaging thread
- Customer accounts (login wall) — auth comes in a later sprint
- Mobile native app

## Success Criteria
A customer visits the site, configures a 50-piece jersey order, previews it on the 3D model, submits with a 30% deposit payment, and a staff member sees the full order in the dashboard and advances its status — all in one session without a support call.
