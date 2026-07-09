drop table if exists activities cascade;
drop table if exists invoices cascade;
drop table if exists order_line_items cascade;
drop table if exists orders cascade;
drop table if exists material_types cascade;

create table if not exists material_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  name text not null,
  description text,
  slug text unique not null
);

alter table material_types enable row level security;
drop policy if exists "material_types_v1_read" on material_types;
create policy "material_types_v1_read" on material_types for select using (true);
drop policy if exists "material_types_v1_write" on material_types;
create policy "material_types_v1_write" on material_types for all using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-files', 'design-files', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf', 'font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff', 'application/font-woff2', 'application/x-font-ttf', 'application/x-font-otf', 'application/octet-stream'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "design_files_v1_read" on storage.objects;
create policy "design_files_v1_read" on storage.objects for select using (bucket_id = 'design-files');
drop policy if exists "design_files_v1_write" on storage.objects;
create policy "design_files_v1_write" on storage.objects for all using (bucket_id = 'design-files') with check (bucket_id = 'design-files');

insert into material_types (id, name, description, slug) values
  ('11111111-0000-0000-0000-000000000001', 'Dry-Fit', 'Moisture-wicking performance fabric', 'dry-fit'),
  ('11111111-0000-0000-0000-000000000002', 'Anti-Bacterial', 'Treated fabric that inhibits bacteria growth', 'anti-bacterial'),
  ('11111111-0000-0000-0000-000000000003', 'Stretch-Resistant Cotton', 'Heavy-duty cotton that holds its shape', 'stretch-resistant-cotton'),
  ('11111111-0000-0000-0000-000000000004', 'Bamboo Blend', 'Eco-friendly soft bamboo-cotton blend', 'bamboo-blend')
on conflict (slug) do nothing;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  reference_code text unique not null default 'ORD-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  access_password_hash text,
  design_service text not null check (design_service in ('use_mine', 'redesign_mine', 'from_scratch', 'slight_modification')),
  design_file_url text,
  design_notes text,
  material_type_id uuid references material_types(id),
  garment_type text not null default 'tshirt',
  base_colour text,
  preview_config jsonb,
  delivery_address text,
  delivery_method text check (delivery_method in ('deliver', 'self_collect')),
  needed_by date,
  total_quantity int not null default 0,
  deposit_amount numeric(10,2),
  deposit_status text not null default 'unpaid' check (deposit_status in ('unpaid', 'paid', 'waived')),
  stripe_deposit_session_id text,
  order_status text not null default 'pending' check (order_status in ('pending', 'in_review', 'in_production', 'ready', 'delivered', 'cancelled')),
  staff_notes text,
  ai_summary text,
  ai_summary_source text,
  ai_summary_confidence numeric,
  ai_summary_review_status text default 'unreviewed'
);

alter table orders enable row level security;
drop policy if exists "orders_v1_read" on orders;
create policy "orders_v1_read" on orders for select using (true);
drop policy if exists "orders_v1_write" on orders;
create policy "orders_v1_write" on orders for all using (true) with check (true);

create table if not exists order_line_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  order_id uuid not null references orders(id) on delete cascade,
  size text not null,
  quantity int not null default 1,
  unit_price numeric(10,2),
  colour text,
  custom_text text
);

alter table order_line_items enable row level security;
drop policy if exists "order_line_items_v1_read" on order_line_items;
create policy "order_line_items_v1_read" on order_line_items for select using (true);
drop policy if exists "order_line_items_v1_write" on order_line_items;
create policy "order_line_items_v1_write" on order_line_items for all using (true) with check (true);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  order_id uuid not null references orders(id) on delete cascade,
  invoice_number text unique not null default 'INV-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  subtotal numeric(10,2) not null default 0,
  deposit_paid numeric(10,2) not null default 0,
  balance_due numeric(10,2) not null default 0,
  payment_status text not null default 'outstanding' check (payment_status in ('outstanding', 'paid', 'partial', 'waived')),
  stripe_payment_session_id text,
  notes text,
  issued_at timestamptz,
  paid_at timestamptz
);

alter table invoices enable row level security;
drop policy if exists "invoices_v1_read" on invoices;
create policy "invoices_v1_read" on invoices for select using (true);
drop policy if exists "invoices_v1_write" on invoices;
create policy "invoices_v1_write" on invoices for all using (true) with check (true);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  actor text,
  metadata jsonb
);

alter table activities enable row level security;
drop policy if exists "activities_v1_read" on activities;
create policy "activities_v1_read" on activities for select using (true);
drop policy if exists "activities_v1_write" on activities;
create policy "activities_v1_write" on activities for all using (true) with check (true);

insert into orders (id, reference_code, customer_name, customer_email, customer_phone, access_password_hash, design_service, garment_type, base_colour, delivery_method, delivery_address, needed_by, total_quantity, deposit_status, order_status, design_notes, material_type_id) values
  ('22222222-0000-0000-0000-000000000001', 'ORD-DEMO0001', 'Ahmad Razif', 'ahmad@example.com', '+601112345678', '9fbe9d7db8ea4c98329a58b7384e3164592db3928b5af4c284c309ec6b3affea', 'from_scratch', 'jersey', 'Navy Blue', 'deliver', '12 Jalan Bukit Bintang, KL 55100', '2025-08-15', 22, 'paid', 'in_production', 'Football jerseys for our company team, need number 1-22, logo on chest', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', 'ORD-DEMO0002', 'Siti Nabilah', 'siti@example.com', '+601187654321', '9fbe9d7db8ea4c98329a58b7384e3164592db3928b5af4c284c309ec6b3affea', 'slight_modification', 'tshirt', 'White', 'self_collect', null, '2025-07-30', 50, 'unpaid', 'pending', 'Volunteer event t-shirts, our logo provided, just need resizing and colour change to white', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000003', 'ORD-DEMO0003', 'Chen Wei Liang', 'wei@example.com', '+60197778888', '9fbe9d7db8ea4c98329a58b7384e3164592db3928b5af4c284c309ec6b3affea', 'redesign_mine', 'polo', 'Black', 'deliver', '88 Jalan Ampang, KL 50450', '2025-09-01', 10, 'paid', 'ready', 'Corporate polo shirts, existing logo needs a modern redesign', '11111111-0000-0000-0000-000000000003'),
  ('22222222-0000-0000-0000-000000000004', 'ORD-DEMO0004', 'Priya Ramasamy', 'priya@example.com', '+60163334444', '9fbe9d7db8ea4c98329a58b7384e3164592db3928b5af4c284c309ec6b3affea', 'use_mine', 'tshirt', 'Red', 'self_collect', null, '2025-08-05', 30, 'paid', 'delivered', 'Family reunion shirts, design ready, just print as-is', '11111111-0000-0000-0000-000000000004')
on conflict (reference_code) do nothing;

insert into order_line_items (id, order_id, size, quantity, colour) values
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'S', 4, 'Navy Blue'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'M', 8, 'Navy Blue'),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'L', 6, 'Navy Blue'),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'XL', 4, 'Navy Blue'),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', 'M', 20, 'White'),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', 'L', 20, 'White'),
  ('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000002', 'XL', 10, 'White'),
  ('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000003', 'M', 5, 'Black'),
  ('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000003', 'L', 5, 'Black'),
  ('33333333-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000004', 'S', 10, 'Red'),
  ('33333333-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000004', 'M', 10, 'Red'),
  ('33333333-0000-0000-0000-000000000012', '22222222-0000-0000-0000-000000000004', 'L', 10, 'Red')
on conflict (id) do nothing;

insert into invoices (order_id, invoice_number, subtotal, deposit_paid, balance_due, payment_status, issued_at, paid_at) values
  ('22222222-0000-0000-0000-000000000003', 'INV-DEMO0001', 550.00, 100.00, 450.00, 'paid', now() - interval '5 days', now() - interval '2 days'),
  ('22222222-0000-0000-0000-000000000004', 'INV-DEMO0002', 900.00, 150.00, 750.00, 'paid', now() - interval '10 days', now() - interval '7 days')
on conflict (invoice_number) do nothing;

insert into activities (id, entity_type, entity_id, action, actor, metadata) values
  ('44444444-0000-0000-0000-000000000001', 'orders', '22222222-0000-0000-0000-000000000001', 'status_changed', 'seed', '{"to":"in_production"}'),
  ('44444444-0000-0000-0000-000000000002', 'invoices', '22222222-0000-0000-0000-000000000003', 'invoice_paid', 'seed', '{"invoice_number":"INV-DEMO0001"}')
on conflict (id) do nothing;
