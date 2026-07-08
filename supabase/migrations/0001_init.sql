create table if not exists tshirt_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  description text,
  price_modifier_pct numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table tshirt_materials enable row level security;
drop policy if exists "tshirt_materials_v1_read" on tshirt_materials;
create policy "tshirt_materials_v1_read" on tshirt_materials for select using (true);
drop policy if exists "tshirt_materials_v1_write" on tshirt_materials;
create policy "tshirt_materials_v1_write" on tshirt_materials for all using (true) with check (true);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_name text not null,
  customer_email text not null,
  design_service text not null default 'use_as_is',
  design_notes text,
  design_file_url text,
  material_id uuid references tshirt_materials(id),
  shirt_colour text,
  print_zone text not null default 'front',
  delivery_date date,
  delivery_type text not null default 'delivery',
  delivery_address text,
  status text not null default 'submitted',
  quoted_price numeric,
  deposit_paid numeric not null default 0,
  balance_paid numeric not null default 0,
  stripe_session_id text,
  stripe_invoice_id text,
  is_urgent boolean not null default false,
  ai_design_suggestion text,
  ai_design_suggestion_source text,
  ai_design_suggestion_confidence numeric,
  ai_design_suggestion_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);

alter table orders enable row level security;
drop policy if exists "orders_v1_read" on orders;
create policy "orders_v1_read" on orders for select using (true);
drop policy if exists "orders_v1_write" on orders;
create policy "orders_v1_write" on orders for all using (true) with check (true);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  order_id uuid references orders(id) on delete cascade,
  size text not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

alter table order_items enable row level security;
drop policy if exists "order_items_v1_read" on order_items;
create policy "order_items_v1_read" on order_items for select using (true);
drop policy if exists "order_items_v1_write" on order_items;
create policy "order_items_v1_write" on order_items for all using (true) with check (true);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  order_id uuid references orders(id) on delete cascade,
  amount numeric not null,
  payment_type text not null default 'deposit',
  stripe_payment_intent_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table payments enable row level security;
drop policy if exists "payments_v1_read" on payments;
create policy "payments_v1_read" on payments for select using (true);
drop policy if exists "payments_v1_write" on payments;
create policy "payments_v1_write" on payments for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  actor text not null,
  action text not null,
  object_type text not null,
  object_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into tshirt_materials (id, name, description, price_modifier_pct, is_active) values
  ('a1000000-0000-0000-0000-000000000001', 'Dry-Fit', 'Moisture-wicking polyester ideal for sports jerseys', 10, true),
  ('a1000000-0000-0000-0000-000000000002', 'Anti-Bacterial', 'Treated cotton blend that inhibits odour-causing bacteria', 15, true),
  ('a1000000-0000-0000-0000-000000000003', 'Stretch-Resistant', 'Reinforced weave that holds shape after repeated wear', 8, true),
  ('a1000000-0000-0000-0000-000000000004', 'Standard Cotton', '100% ring-spun cotton, classic feel and print surface', 0, true)
on conflict (id) do nothing;

insert into orders (id, customer_name, customer_email, design_service, design_notes, material_id, shirt_colour, print_zone, delivery_date, delivery_type, delivery_address, status, quoted_price, deposit_paid, balance_paid, is_urgent) values
  ('b1000000-0000-0000-0000-000000000001', 'Priya Ramasamy', 'priya@example.com', 'slight_modification', 'Company logo on front, team name on back in bold white', 'a1000000-0000-0000-0000-000000000001', '#003087', 'both', current_date + 12, 'delivery', '45 Jalan Bukit Timah, Singapore 587789', 'in_production', 850.00, 255.00, 0, false),
  ('b1000000-0000-0000-0000-000000000002', 'Marcus Tan', 'marcus.t@example.com', 'from_scratch', 'Football jersey for U16 team, red and black, player numbers 1-22', 'a1000000-0000-0000-0000-000000000001', '#CC0000', 'front', current_date + 5, 'collection', null, 'in_review', 1200.00, 360.00, 0, true),
  ('b1000000-0000-0000-0000-000000000003', 'Siti Norzahra', 'siti.nz@example.com', 'use_as_is', 'Print exactly as uploaded — orientation as shown', 'a1000000-0000-0000-0000-000000000004', '#FFFFFF', 'front', current_date + 20, 'delivery', '12 Tampines Avenue 4, Singapore 529660', 'submitted', 420.00, 126.00, 0, false),
  ('b1000000-0000-0000-0000-000000000004', 'David Lim', 'david.lim@example.com', 'redesign', 'Upgrade our old logo to something modern, keep the colour scheme', 'a1000000-0000-0000-0000-000000000002', '#2E8B57', 'both', current_date - 3, 'delivery', '8 Toa Payoh Lorong 1, Singapore 310008', 'ready', 560.00, 168.00, 392.00, false)
on conflict (id) do nothing;

insert into order_items (order_id, size, quantity) values
  ('b1000000-0000-0000-0000-000000000001', 'S', 5),
  ('b1000000-0000-0000-0000-000000000001', 'M', 15),
  ('b1000000-0000-0000-0000-000000000001', 'L', 10),
  ('b1000000-0000-0000-0000-000000000002', 'S', 4),
  ('b1000000-0000-0000-0000-000000000002', 'M', 8),
  ('b1000000-0000-0000-0000-000000000002', 'L', 8),
  ('b1000000-0000-0000-0000-000000000002', 'XL', 2),
  ('b1000000-0000-0000-0000-000000000003', 'M', 10),
  ('b1000000-0000-0000-0000-000000000003', 'L', 10),
  ('b1000000-0000-0000-0000-000000000004', 'S', 5),
  ('b1000000-0000-0000-0000-000000000004', 'M', 10),
  ('b1000000-0000-0000-0000-000000000004', 'L', 5)
on conflict do nothing;

insert into payments (order_id, amount, payment_type, stripe_payment_intent_id, status) values
  ('b1000000-0000-0000-0000-000000000001', 255.00, 'deposit', 'pi_demo_001', 'succeeded'),
  ('b1000000-0000-0000-0000-000000000002', 360.00, 'deposit', 'pi_demo_002', 'succeeded'),
  ('b1000000-0000-0000-0000-000000000003', 126.00, 'deposit', 'pi_demo_003', 'succeeded'),
  ('b1000000-0000-0000-0000-000000000004', 168.00, 'deposit', 'pi_demo_004', 'succeeded'),
  ('b1000000-0000-0000-0000-000000000004', 392.00, 'balance', 'pi_demo_005', 'succeeded')
on conflict do nothing;