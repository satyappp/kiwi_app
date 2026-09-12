-- Make validated RPCs the only mutation boundary for inventory allocation.
-- This migration is intentionally non-destructive and is safe for databases
-- where the inventory and shipping SQL was previously run in the SQL editor.

begin;

alter function public.create_shipping_sale(
  uuid, uuid, uuid, uuid, numeric, numeric, date, date, text
) security definer;
alter function public.create_shipping_sale(
  uuid, uuid, uuid, uuid, numeric, numeric, date, date, text
) set search_path = '';

drop policy if exists inventory_reservations_insert
  on public.inventory_reservations;
drop policy if exists inventory_reservations_update
  on public.inventory_reservations;
drop policy if exists inventory_shipments_insert
  on public.inventory_shipments;
drop policy if exists inventory_shipments_update
  on public.inventory_shipments;
drop policy if exists shipping_sales_insert
  on public.shipping_sales;
drop policy if exists shipping_sale_allocations_insert
  on public.shipping_sale_allocations;

revoke insert, update, delete, truncate
  on table public.inventory_reservations, public.inventory_shipments
  from public, anon, authenticated;
revoke insert, update, delete, truncate
  on table public.shipping_sales, public.shipping_sale_allocations
  from public, anon, authenticated;

grant select
  on table public.inventory_reservations, public.inventory_shipments,
    public.shipping_sales, public.shipping_sale_allocations
  to authenticated;

revoke execute on function public.create_shipping_sale(
  uuid, uuid, uuid, uuid, numeric, numeric, date, date, text
) from public, anon;
grant execute on function public.create_shipping_sale(
  uuid, uuid, uuid, uuid, numeric, numeric, date, date, text
) to authenticated;

comment on function public.create_shipping_sale(
  uuid, uuid, uuid, uuid, numeric, numeric, date, date, text
) is 'Authenticated, atomic FIFO boundary for shipping-sale creation and stock allocation.';

commit;
