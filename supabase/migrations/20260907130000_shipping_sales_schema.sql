-- Shipping and sales entry with size-aware, atomic inventory allocation.
-- Apply after business partners, ripening, and inventory migrations.

begin;

create table if not exists public.delivery_packages (
  id uuid primary key default gen_random_uuid(),
  legacy_id text not null unique check (btrim(legacy_id) <> ''),
  source_sorting_title text not null,
  package_name text,
  package_format text,
  unit_price_yen_per_kg numeric(12,2) check (unit_price_yen_per_kg is null or unit_price_yen_per_kg >= 0),
  notes text,
  variety_id uuid references public.varieties(id) on update cascade on delete restrict,
  size_standard_id uuid references public.size_standards(id) on update cascade on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_sales (
  id uuid primary key default gen_random_uuid(),
  business_partner_id uuid not null references public.business_partners(id) on update cascade on delete restrict,
  variety_id uuid not null references public.varieties(id) on update cascade on delete restrict,
  size_standard_id uuid not null references public.size_standards(id) on update cascade on delete restrict,
  delivery_package_id uuid references public.delivery_packages(id) on update cascade on delete restrict,
  quantity_kg numeric(12,2) not null check (quantity_kg > 0),
  unit_price_yen_per_kg numeric(12,2) not null check (unit_price_yen_per_kg >= 0),
  delivery_date date not null,
  shipping_date date not null,
  notes text check (notes is null or char_length(notes) <= 500),
  cancelled_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (delivery_date >= shipping_date)
);

create table if not exists public.shipping_sale_allocations (
  id uuid primary key default gen_random_uuid(),
  shipping_sale_id uuid not null references public.shipping_sales(id) on update cascade on delete restrict,
  ripening_batch_item_id uuid not null references public.ripening_batch_items(id) on update cascade on delete restrict,
  weight_kg numeric(12,2) not null check (weight_kg > 0),
  created_by uuid not null default auth.uid() references public.profiles(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (shipping_sale_id, ripening_batch_item_id)
);

create index if not exists shipping_sales_lookup_idx
  on public.shipping_sales (variety_id, size_standard_id, shipping_date)
  where cancelled_at is null;
create index if not exists shipping_sale_allocations_item_idx
  on public.shipping_sale_allocations (ripening_batch_item_id);

drop trigger if exists delivery_packages_set_updated_at on public.delivery_packages;
create trigger delivery_packages_set_updated_at before update on public.delivery_packages
  for each row execute function public.set_updated_at();
drop trigger if exists shipping_sales_set_updated_at on public.shipping_sales;
create trigger shipping_sales_set_updated_at before update on public.shipping_sales
  for each row execute function public.set_updated_at();

with source_data (legacy_id, source_sorting_title, variety_name, size_code, package_name, package_format, unit_price, notes) as (values
  ('cc20a399', 'さぬきキウイっこ1号_M', 'さぬきキウイっこ1号', 'M', 'さぬきキウイっこ1号_M_卸_パック付き_1500(税抜き)', '卸_パック付き_1500(税抜き)', 1620::numeric, null::text),
  ('847c0a64', 'さぬきキウイっこ1号_M', 'さぬきキウイっこ1号', 'M', 'さぬきキウイっこ1号_M_卸_パックなし_1400(税抜き)', '卸_パックなし_1400(税抜き)', 1512, null),
  ('8560da81', 'さぬきキウイっこ1号_M', 'さぬきキウイっこ1号', 'M', 'さぬきキウイっこ1号_M_直売_2500', '直売_2500', 3000, null),
  ('248edb8e', 'さぬきキウイっこ1号_M', 'さぬきキウイっこ1号', 'M', 'さぬきキウイっこ1号_M_EC_3000', 'EC_3000', 2500, null),
  ('9b2a6be1', 'さぬきキウイっこ1号_M', 'さぬきキウイっこ1号', 'M', 'さぬきキウイっこ1号_M_委託販売_15%', '委託販売_15%', 3000, '委託販売のため在庫リスクあり'),
  ('cca69d53', 'さぬきキウイっこ1号_M', 'さぬきキウイっこ1号', 'M', 'さぬきキウイっこ1号_M_直売_2500', '直売_2500', 2500, null),
  ('97a8f347', '紅妃_SS', '紅妃', 'SS', '紅妃_SS_直売_2500', '直売_2500', 2000, null),
  ('091f1d74', '紅妃_M', '紅妃', 'M', '紅妃_M_EC_2000', 'EC_2000', null, null),
  ('56152678', 'さぬきキウイっこ1号_M', 'さぬきキウイっこ1号', 'M', 'さぬきキウイっこ1号_M_卸_70%', '卸_70%', 1750, null),
  ('8f6a2c29', '香緑_LL', '香緑', 'LL', '香緑_LL_卸_70%', '卸_70%', 1400, null),
  ('1cccadcc', '香緑_L', '香緑', 'L', '香緑_L_直売_2000', '直売_2000', 2000, null),
  ('050e55d1', '香緑_LL', '香緑', 'LL', '香緑_LL_直売_2000', '直売_2000', 2000, null),
  ('7eaba4e8', '香緑_L', '香緑', 'L', '香緑_L_卸_70%', '卸_70%', 1400, null),
  ('94eec40c', 'シカクイキウイ_LL', 'シカクイキウイ', 'LL', 'シカクイキウイ_LL_ケーキ_卸1353', 'ケーキ_卸1353', 1353, null),
  ('b2af4f07', 'シカクイキウイ_LL', 'シカクイキウイ', 'LL', 'シカクイキウイ_LL_ケーキ_委託1644', 'ケーキ_委託1644', 1644, null),
  ('9e26e7a8', 'シカクイキウイ直売', null, null, null, null, 4, null)
)
insert into public.delivery_packages (
  legacy_id, source_sorting_title, package_name, package_format,
  unit_price_yen_per_kg, notes, variety_id, size_standard_id, is_active
)
select source.legacy_id, source.source_sorting_title, source.package_name,
  source.package_format, source.unit_price, source.notes, variety.id, size.id,
  (variety.id is not null and size.id is not null and source.package_name is not null)
from source_data source
left join public.varieties variety on variety.name = source.variety_name
left join public.size_standards size on size.code = source.size_code
on conflict (legacy_id) do update set
  source_sorting_title = excluded.source_sorting_title,
  package_name = excluded.package_name,
  package_format = excluded.package_format,
  unit_price_yen_per_kg = excluded.unit_price_yen_per_kg,
  notes = excluded.notes,
  variety_id = excluded.variety_id,
  size_standard_id = excluded.size_standard_id,
  is_active = excluded.is_active;

create or replace view public.shipping_available_inventory
with (security_invoker = true) as
with allocated as (
  select allocation.ripening_batch_item_id,
    sum(allocation.weight_kg)::numeric(12,2) as allocated_weight_kg
  from public.shipping_sale_allocations allocation
  join public.shipping_sales sale on sale.id = allocation.shipping_sale_id
  where sale.cancelled_at is null
  group by allocation.ripening_batch_item_id
)
select harvest.variety_id, variety.name as variety_name,
  sorting.size_standard_id, size.code as size_code,
  sum(item.weight_kg - coalesce(allocated.allocated_weight_kg, 0))::numeric(12,2) as available_weight_kg
from public.ripening_batch_items item
join public.ripening_batches batch on batch.id = item.ripening_batch_id
join public.sorting_logs sorting on sorting.id = item.sorting_log_id
join public.harvest_logs harvest on harvest.id = sorting.harvest_log_id
join public.varieties variety on variety.id = harvest.variety_id
join public.size_standards size on size.id = sorting.size_standard_id
left join allocated on allocated.ripening_batch_item_id = item.id
where not item.is_void and batch.completed_at is not null and batch.cancelled_at is null
group by harvest.variety_id, variety.name, sorting.size_standard_id, size.code
having sum(item.weight_kg - coalesce(allocated.allocated_weight_kg, 0)) > 0;

create or replace function public.create_shipping_sale(
  p_business_partner_id uuid, p_variety_id uuid, p_size_standard_id uuid,
  p_delivery_package_id uuid, p_quantity_kg numeric,
  p_unit_price_yen_per_kg numeric, p_delivery_date date,
  p_shipping_date date, p_notes text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  sale_id uuid;
  remaining numeric(12,2) := p_quantity_kg;
  stock record;
  take_weight numeric(12,2);
begin
  if (select auth.uid()) is null then raise exception 'Authentication is required'; end if;
  if p_quantity_kg <= 0 or p_unit_price_yen_per_kg < 0 then raise exception 'Invalid quantity or unit price'; end if;
  if p_delivery_date < p_shipping_date then raise exception 'Delivery date must be on or after shipping date'; end if;
  perform 1 from public.business_partners where id = p_business_partner_id and is_active;
  if not found then raise exception 'Active business partner is required'; end if;
  if p_delivery_package_id is not null then
    perform 1 from public.delivery_packages where id = p_delivery_package_id and is_active
      and variety_id = p_variety_id and size_standard_id = p_size_standard_id;
    if not found then raise exception 'Delivery package does not match variety and size'; end if;
  end if;

  -- Serialize sales for the same variety/size before calculating FIFO stock.
  perform pg_advisory_xact_lock(hashtextextended(p_variety_id::text || ':' || p_size_standard_id::text, 0));

  insert into public.shipping_sales (
    business_partner_id, variety_id, size_standard_id, delivery_package_id,
    quantity_kg, unit_price_yen_per_kg, delivery_date, shipping_date, notes, created_by
  ) values (
    p_business_partner_id, p_variety_id, p_size_standard_id, p_delivery_package_id,
    p_quantity_kg, p_unit_price_yen_per_kg, p_delivery_date, p_shipping_date,
    nullif(btrim(p_notes), ''), (select auth.uid())
  ) returning id into sale_id;

  for stock in
    select item.id,
      (item.weight_kg - coalesce((
        select sum(a.weight_kg) from public.shipping_sale_allocations a
        join public.shipping_sales s on s.id = a.shipping_sale_id
        where a.ripening_batch_item_id = item.id and s.cancelled_at is null
      ), 0))::numeric(12,2) as available_weight_kg
    from public.ripening_batch_items item
    join public.ripening_batches batch on batch.id = item.ripening_batch_id
    join public.sorting_logs sorting on sorting.id = item.sorting_log_id
    join public.harvest_logs harvest on harvest.id = sorting.harvest_log_id
    where not item.is_void and batch.completed_at is not null and batch.cancelled_at is null
      and harvest.variety_id = p_variety_id and sorting.size_standard_id = p_size_standard_id
    order by batch.completed_at, item.created_at
    for update of item
  loop
    exit when remaining <= 0;
    if stock.available_weight_kg > 0 then
      take_weight := least(remaining, stock.available_weight_kg);
      insert into public.shipping_sale_allocations (
        shipping_sale_id, ripening_batch_item_id, weight_kg, created_by
      ) values (sale_id, stock.id, take_weight, (select auth.uid()));
      remaining := remaining - take_weight;
    end if;
  end loop;

  if remaining > 0 then raise exception 'Insufficient ready-to-ship inventory'; end if;
  return sale_id;
end;
$$;

-- Replace the inventory projection so a sale immediately leaves ready stock.
-- Future shipping dates are reservations; today/past shipping dates are shipped.
create or replace view public.inventory_status
with (security_invoker = true) as
with allocated as (
  select allocation.ripening_batch_item_id,
    sum(allocation.weight_kg)::numeric(12,2) as allocated_weight_kg
  from public.shipping_sale_allocations allocation
  join public.shipping_sales sale on sale.id = allocation.shipping_sale_id
  where sale.cancelled_at is null
  group by allocation.ripening_batch_item_id
), item_stock as (
  select item.id, batch.id as batch_id, batch.title, batch.variety_id,
    variety.name as variety_name, size.code as size_name,
    location.name as location_name, batch.started_at, batch.shippable_at,
    batch.completed_at, item.weight_kg,
    (item.weight_kg - coalesce(allocated.allocated_weight_kg, 0))::numeric(12,2) as available_weight_kg
  from public.ripening_batch_items item
  join public.ripening_batches batch on batch.id = item.ripening_batch_id
  join public.ripening_locations location on location.id = batch.location_id
  join public.sorting_logs sorting on sorting.id = item.sorting_log_id
  join public.size_standards size on size.id = sorting.size_standard_id
  join public.varieties variety on variety.id = batch.variety_id
  left join allocated on allocated.ripening_batch_item_id = item.id
  where not item.is_void and batch.cancelled_at is null
)
select 'cold'::text as status, source.sorting_log_id as source_id,
  source.sorting_title as title, source.variety_id, source.variety_name,
  source.plot_name, source.size_name, null::text as location_name,
  source.sorting_date::timestamptz as occurred_at,
  source.available_weight_kg::numeric(12,2) as weight_kg,
  source.ethylene_start_deadline::timestamptz as deadline_at,
  null::text as customer_name
from public.sorting_ripening_status source where source.available_weight_kg > 0
union all
select 'ripening', stock.id, stock.title, stock.variety_id, stock.variety_name,
  null::text, stock.size_name, stock.location_name, stock.started_at,
  stock.weight_kg, stock.shippable_at, null::text
from item_stock stock where stock.completed_at is null and stock.weight_kg > 0
union all
select 'ready', stock.id, stock.title, stock.variety_id, stock.variety_name,
  null::text, stock.size_name, stock.location_name, stock.completed_at,
  stock.available_weight_kg, null::timestamptz, null::text
from item_stock stock where stock.completed_at is not null and stock.available_weight_kg > 0
union all
select case when sale.shipping_date > ((now() at time zone 'Asia/Tokyo')::date)
    then 'reserved' else 'shipped' end,
  sale.id, concat(variety.name, '_', size.code), sale.variety_id, variety.name,
  null::text, size.code, null::text, sale.created_at, sale.quantity_kg,
  null::timestamptz, partner.short_name
from public.shipping_sales sale
join public.varieties variety on variety.id = sale.variety_id
join public.size_standards size on size.id = sale.size_standard_id
join public.business_partners partner on partner.id = sale.business_partner_id
where sale.cancelled_at is null;

alter table public.delivery_packages enable row level security;
alter table public.shipping_sales enable row level security;
alter table public.shipping_sale_allocations enable row level security;

drop policy if exists delivery_packages_select on public.delivery_packages;
drop policy if exists shipping_sales_select on public.shipping_sales;
drop policy if exists shipping_sales_insert on public.shipping_sales;
drop policy if exists shipping_sale_allocations_select on public.shipping_sale_allocations;
drop policy if exists shipping_sale_allocations_insert on public.shipping_sale_allocations;
create policy delivery_packages_select on public.delivery_packages for select to authenticated using (true);
create policy shipping_sales_select on public.shipping_sales for select to authenticated using (true);
create policy shipping_sale_allocations_select on public.shipping_sale_allocations for select to authenticated using (true);

revoke all on table public.delivery_packages, public.shipping_sales,
  public.shipping_sale_allocations, public.shipping_available_inventory
from public, anon, authenticated;
grant select on table public.delivery_packages, public.shipping_available_inventory to authenticated;
grant select on table public.shipping_sales, public.shipping_sale_allocations to authenticated;
revoke execute on function public.create_shipping_sale(uuid, uuid, uuid, uuid, numeric, numeric, date, date, text)
  from public, anon;
grant execute on function public.create_shipping_sale(uuid, uuid, uuid, uuid, numeric, numeric, date, date, text)
  to authenticated;

comment on table public.delivery_packages is '納品パッケージマスタ_ext.xlsxを元にした品種・サイズ別の納品形態とkg単価。';
comment on table public.shipping_sales is '出荷・販売登録。引当明細と同じトランザクションで作成する。';
comment on view public.shipping_available_inventory is '追熟完了明細から未引当分を品種・サイズ別に集計した出荷可能在庫。';

commit;
