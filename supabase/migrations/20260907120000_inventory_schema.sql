-- Inventory projection plus preserved reservation/shipment tables.
-- Apply after harvest, sorting, and ripening migrations.
-- The app writes shipping allocations through create_shipping_sale(); the
-- earlier reservation/shipment tables remain read-only for compatibility.

begin;

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  ripening_batch_id uuid not null
    references public.ripening_batches(id) on update cascade on delete restrict,
  customer_name text not null check (btrim(customer_name) <> ''),
  weight_kg numeric(12,2) not null check (weight_kg > 0),
  reserved_at timestamptz not null default now(),
  cancelled_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 500),
  created_by uuid not null default auth.uid()
    references public.profiles(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_reservations_batch_idx
  on public.inventory_reservations (ripening_batch_id)
  where cancelled_at is null;

create table if not exists public.inventory_shipments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null
    references public.inventory_reservations(id)
    on update cascade on delete restrict,
  weight_kg numeric(12,2) not null check (weight_kg > 0),
  shipped_at timestamptz not null default now(),
  is_void boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 500),
  created_by uuid not null default auth.uid()
    references public.profiles(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_shipments_reservation_idx
  on public.inventory_shipments (reservation_id)
  where not is_void;

create or replace function public.prepare_inventory_reservation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  batch_weight numeric(12,2);
  committed_weight numeric(12,2);
  shipped_weight numeric(12,2);
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.id := old.id;
    new.ripening_batch_id := old.ripening_batch_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;

    if old.cancelled_at is not null
       and new.cancelled_at is distinct from old.cancelled_at then
      raise exception 'Cancelled reservation cannot be reactivated';
    end if;
  end if;

  if new.created_by is null then
    raise exception 'Authentication is required';
  end if;

  perform 1
  from public.ripening_batches batch
  where batch.id = new.ripening_batch_id
    and batch.completed_at is not null
    and batch.cancelled_at is null
  for update;

  if not found then
    raise exception 'Only completed ripening batches can be reserved';
  end if;

  select coalesce(sum(item.weight_kg) filter (where not item.is_void), 0)
  into batch_weight
  from public.ripening_batch_items item
  where item.ripening_batch_id = new.ripening_batch_id;

  select coalesce(sum(reservation.weight_kg), 0)
  into committed_weight
  from public.inventory_reservations reservation
  where reservation.ripening_batch_id = new.ripening_batch_id
    and reservation.cancelled_at is null
    and reservation.id is distinct from new.id;

  select coalesce(sum(shipment.weight_kg) filter (where not shipment.is_void), 0)
  into shipped_weight
  from public.inventory_shipments shipment
  where shipment.reservation_id = new.id;

  if new.cancelled_at is not null and shipped_weight > 0 then
    raise exception 'A reservation with shipments cannot be cancelled';
  end if;

  if new.cancelled_at is null and committed_weight + new.weight_kg > batch_weight then
    raise exception 'Reserved weight exceeds ready-to-ship inventory';
  end if;

  if new.weight_kg < shipped_weight then
    raise exception 'Reservation weight cannot be less than shipped weight';
  end if;

  new.customer_name := btrim(new.customer_name);
  new.notes := nullif(btrim(new.notes), '');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inventory_reservations_prepare
  on public.inventory_reservations;
create trigger inventory_reservations_prepare
  before insert or update on public.inventory_reservations
  for each row execute function public.prepare_inventory_reservation();

create or replace function public.prepare_inventory_shipment()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  reserved_weight numeric(12,2);
  shipped_weight numeric(12,2);
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.id := old.id;
    new.reservation_id := old.reservation_id;
    new.weight_kg := old.weight_kg;
    new.shipped_at := old.shipped_at;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if new.created_by is null then
    raise exception 'Authentication is required';
  end if;

  select reservation.weight_kg
  into reserved_weight
  from public.inventory_reservations reservation
  where reservation.id = new.reservation_id
    and reservation.cancelled_at is null
  for update;

  if not found then
    raise exception 'Active reservation is required for shipment';
  end if;

  select coalesce(sum(shipment.weight_kg) filter (where not shipment.is_void), 0)
  into shipped_weight
  from public.inventory_shipments shipment
  where shipment.reservation_id = new.reservation_id
    and shipment.id is distinct from new.id;

  if not new.is_void and shipped_weight + new.weight_kg > reserved_weight then
    raise exception 'Shipped weight exceeds reserved weight';
  end if;

  new.notes := nullif(btrim(new.notes), '');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inventory_shipments_prepare
  on public.inventory_shipments;
create trigger inventory_shipments_prepare
  before insert or update on public.inventory_shipments
  for each row execute function public.prepare_inventory_shipment();

create or replace view public.inventory_status
with (security_invoker = true) as
with batch_weights as (
  select
    batch.id as ripening_batch_id,
    batch.title,
    batch.variety_id,
    variety.name as variety_name,
    location.name as location_name,
    batch.started_at,
    batch.shippable_at,
    batch.completed_at,
    batch.updated_at,
    coalesce(sum(item.weight_kg) filter (where not item.is_void), 0)::numeric(12,2)
      as batch_weight_kg
  from public.ripening_batches batch
  join public.varieties variety on variety.id = batch.variety_id
  join public.ripening_locations location on location.id = batch.location_id
  left join public.ripening_batch_items item
    on item.ripening_batch_id = batch.id
  where batch.cancelled_at is null
  group by batch.id, variety.name, location.name
),
reservation_totals as (
  select
    reservation.ripening_batch_id,
    coalesce(sum(reservation.weight_kg), 0)::numeric(12,2) as reserved_weight_kg
  from public.inventory_reservations reservation
  where reservation.cancelled_at is null
  group by reservation.ripening_batch_id
),
shipment_totals as (
  select
    shipment.reservation_id,
    coalesce(sum(shipment.weight_kg), 0)::numeric(12,2) as shipped_weight_kg
  from public.inventory_shipments shipment
  where not shipment.is_void
  group by shipment.reservation_id
)
select
  'cold'::text as status,
  source.sorting_log_id as source_id,
  source.sorting_title as title,
  source.variety_id,
  source.variety_name,
  source.plot_name,
  source.size_name,
  null::text as location_name,
  source.sorting_date::timestamptz as occurred_at,
  source.available_weight_kg::numeric(12,2) as weight_kg,
  source.ethylene_start_deadline::timestamptz as deadline_at,
  null::text as customer_name
from public.sorting_ripening_status source
where source.available_weight_kg > 0

union all

select
  'ripening'::text,
  batch.ripening_batch_id,
  batch.title,
  batch.variety_id,
  batch.variety_name,
  null::text,
  null::text,
  batch.location_name,
  batch.started_at,
  batch.batch_weight_kg,
  batch.shippable_at,
  null::text
from batch_weights batch
where batch.completed_at is null and batch.batch_weight_kg > 0

union all

select
  'ready'::text,
  batch.ripening_batch_id,
  batch.title,
  batch.variety_id,
  batch.variety_name,
  null::text,
  null::text,
  batch.location_name,
  batch.completed_at,
  (batch.batch_weight_kg - coalesce(reserved.reserved_weight_kg, 0))::numeric(12,2),
  null::timestamptz,
  null::text
from batch_weights batch
left join reservation_totals reserved
  on reserved.ripening_batch_id = batch.ripening_batch_id
where batch.completed_at is not null
  and batch.batch_weight_kg - coalesce(reserved.reserved_weight_kg, 0) > 0

union all

select
  'reserved'::text,
  reservation.id,
  batch.title,
  batch.variety_id,
  batch.variety_name,
  null::text,
  null::text,
  batch.location_name,
  reservation.reserved_at,
  (reservation.weight_kg - coalesce(shipped.shipped_weight_kg, 0))::numeric(12,2),
  null::timestamptz,
  reservation.customer_name
from public.inventory_reservations reservation
join batch_weights batch
  on batch.ripening_batch_id = reservation.ripening_batch_id
left join shipment_totals shipped on shipped.reservation_id = reservation.id
where reservation.cancelled_at is null
  and reservation.weight_kg - coalesce(shipped.shipped_weight_kg, 0) > 0

union all

select
  'shipped'::text,
  shipment.id,
  batch.title,
  batch.variety_id,
  batch.variety_name,
  null::text,
  null::text,
  batch.location_name,
  shipment.shipped_at,
  shipment.weight_kg,
  null::timestamptz,
  reservation.customer_name
from public.inventory_shipments shipment
join public.inventory_reservations reservation
  on reservation.id = shipment.reservation_id
join batch_weights batch
  on batch.ripening_batch_id = reservation.ripening_batch_id
where not shipment.is_void;

comment on view public.inventory_status is
  '品種別に冷蔵中、追熟中、出荷可能、予約済み、出荷済み重量を表示する在庫ビュー。';

alter table public.inventory_reservations enable row level security;
alter table public.inventory_shipments enable row level security;

drop policy if exists inventory_reservations_select on public.inventory_reservations;
drop policy if exists inventory_reservations_insert on public.inventory_reservations;
drop policy if exists inventory_reservations_update on public.inventory_reservations;
create policy inventory_reservations_select on public.inventory_reservations
  for select to authenticated using (true);

drop policy if exists inventory_shipments_select on public.inventory_shipments;
drop policy if exists inventory_shipments_insert on public.inventory_shipments;
drop policy if exists inventory_shipments_update on public.inventory_shipments;
create policy inventory_shipments_select on public.inventory_shipments
  for select to authenticated using (true);

revoke all on table
  public.inventory_reservations,
  public.inventory_shipments,
  public.inventory_status
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on table
  public.inventory_reservations,
  public.inventory_shipments
to authenticated;
grant select on table public.inventory_status to authenticated;

revoke execute on function public.prepare_inventory_reservation()
  from public, anon, authenticated;
revoke execute on function public.prepare_inventory_shipment()
  from public, anon, authenticated;

commit;
