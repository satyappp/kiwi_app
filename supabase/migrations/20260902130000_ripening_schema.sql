-- ============================================================================
-- キウイ農園 — ripening（追熟管理）schema
--
-- 20260902120000_sorting_date_input.sql の後に実行する。
--
-- 追熟条件は月・品種別のマスタとして管理し、実際に使用した温度・時間は
-- 追熟ロットへスナップショット保存する。追熟ロットの内訳は選果ログ単位で
-- 記録し、同じ選果重量を重複して追熟へ割り当てない。
-- ============================================================================

begin;

-- ===========================================================================
-- varieties — 参照スプレッドシートにあり、既存マスタにない品種を補う
-- ===========================================================================
insert into public.varieties (name, sort_order) values
  ('YN7',              80),
  ('YN11',             81),
  ('ジャンボイエロー', 82),
  ('ゴールドおおくま', 83)
on conflict do nothing;

-- ===========================================================================
-- ripening_locations — 追熟場所マスタ
-- 実際の場所名は運用開始前に登録する。過去参照を守るため削除せず無効化する。
-- ===========================================================================
create table if not exists public.ripening_locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (btrim(name) <> ''),
  is_active  boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ripening_locations_name_unique
  on public.ripening_locations (lower(btrim(name)));

drop trigger if exists ripening_locations_set_updated_at
  on public.ripening_locations;
create trigger ripening_locations_set_updated_at
  before update on public.ripening_locations
  for each row execute function public.set_updated_at();

comment on table public.ripening_locations is
  '追熟を行う場所のマスタ。使用停止する場所は削除せずis_activeをfalseにする。';

-- ===========================================================================
-- ripening_rules — 月・品種別の追熟条件マスタ
--
-- 参照元: Google Sheets「26_ReFruits追熟マスタ_ext / 追熟マスタ」
-- 未確定のセルはNULLのまま保持し、推測値は登録しない。
-- ===========================================================================
create table if not exists public.ripening_rules (
  id                         uuid primary key default gen_random_uuid(),
  legacy_id                  bigint unique,
  variety_id                 uuid not null
                               references public.varieties(id)
                               on update cascade on delete restrict,
  start_month                smallint not null
                               check (start_month between 1 and 12),
  ethylene_temperature_c     numeric(5,2)
                               check (
                                 ethylene_temperature_c is null
                                 or ethylene_temperature_c between -20 and 60
                               ),
  ethylene_duration_hours    numeric(8,2)
                               check (
                                 ethylene_duration_hours is null
                                 or ethylene_duration_hours > 0
                               ),
  resting_temperature_c      numeric(5,2)
                               check (
                                 resting_temperature_c is null
                                 or resting_temperature_c between -20 and 60
                               ),
  resting_duration_hours     numeric(8,2)
                               check (
                                 resting_duration_hours is null
                                 or resting_duration_hours >= 0
                               ),
  shelf_life_days            smallint
                               check (
                                 shelf_life_days is null or shelf_life_days >= 0
                               ),
  shipping_window_days       smallint
                               check (
                                 shipping_window_days is null
                                 or shipping_window_days >= 0
                               ),
  is_active                  boolean not null default true,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (variety_id, start_month),
  unique (id, variety_id)
);

create index if not exists ripening_rules_lookup_idx
  on public.ripening_rules (variety_id, start_month)
  where is_active;

drop trigger if exists ripening_rules_set_updated_at on public.ripening_rules;
create trigger ripening_rules_set_updated_at
  before update on public.ripening_rules
  for each row execute function public.set_updated_at();

comment on table public.ripening_rules is
  '月・品種別の標準追熟条件。未確定値はNULLで保持する。';
comment on column public.ripening_rules.legacy_id is
  '参照スプレッドシート「追熟マスタ」のid。';
comment on column public.ripening_rules.shipping_window_days is
  '追熟完了後、出荷すべき期間の日数。参照元で未確定の値はNULL。';

-- 参照シートにある10月〜4月 × 11品種（77行）をそのまま作成する。
-- 入力済みの条件は「10月・紅妃」のエチレン48時間、寝かせ15℃/120時間のみ。
with source_months(month_number, month_order) as (
  values
    (10::smallint, 0),
    (11::smallint, 1),
    (12::smallint, 2),
    ( 1::smallint, 3),
    ( 2::smallint, 4),
    ( 3::smallint, 5),
    ( 4::smallint, 6)
),
source_varieties(variety_name, variety_order) as (
  values
    ('紅妃',                    1),
    ('さぬきキウイっこ5号',     2),
    ('さぬきキウイっこ1号',     3),
    ('ヘイワード',              4),
    ('香緑',                    5),
    ('東京ゴールド',            6),
    ('YN7',                     7),
    ('YN11',                    8),
    ('センセーションアップル',  9),
    ('ジャンボイエロー',       10),
    ('ゴールドおおくま',       11)
)
insert into public.ripening_rules (
  legacy_id,
  variety_id,
  start_month,
  ethylene_temperature_c,
  ethylene_duration_hours,
  resting_temperature_c,
  resting_duration_hours
)
select
  (m.month_order * 11 + source.variety_order)::bigint,
  variety.id,
  m.month_number,
  null,
  case
    when m.month_number = 10 and source.variety_name = '紅妃' then 48
    else null
  end,
  case
    when m.month_number = 10 and source.variety_name = '紅妃' then 15
    else null
  end,
  case
    when m.month_number = 10 and source.variety_name = '紅妃' then 120
    else null
  end
from source_months m
cross join source_varieties source
join public.varieties variety
  on lower(btrim(variety.name)) = lower(btrim(source.variety_name))
on conflict (variety_id, start_month) do nothing;

-- ===========================================================================
-- ripening_batches — 追熟ロット
--
-- 人が選ぶ・入力する値:
--   variety_id、location_id、started_at、温度・時間、通知の有効/無効
--
-- DBが自動設定する値:
--   担当者、追熟No.、タイトル、終了予定、寝かせ開始、出荷可能日時
--
-- ルールの値は開始時にコピーする。後日ルールを変更しても過去ロットは変わらない。
-- ===========================================================================
create table if not exists public.ripening_batches (
  id                         uuid primary key default gen_random_uuid(),
  legacy_id                  text unique,
  ripening_no                bigint generated always as identity unique,
  staff_id                   uuid not null default auth.uid()
                               references public.profiles(id)
                               on update cascade on delete restrict,
  variety_id                 uuid not null
                               references public.varieties(id)
                               on update cascade on delete restrict,
  location_id                uuid not null
                               references public.ripening_locations(id)
                               on update cascade on delete restrict,
  rule_id                    uuid,
  title                      text not null,

  started_at                 timestamptz not null default now(),
  ethylene_temperature_c     numeric(5,2)
                               check (
                                 ethylene_temperature_c is null
                                 or ethylene_temperature_c between -20 and 60
                               ),
  ethylene_processing_hours  numeric(8,2) not null
                               check (ethylene_processing_hours > 0),
  ethylene_started_at        timestamptz not null,
  ethylene_ended_at          timestamptz not null,
  ethylene_removed_at        timestamptz,

  resting_temperature_c      numeric(5,2)
                               check (
                                 resting_temperature_c is null
                                 or resting_temperature_c between -20 and 60
                               ),
  resting_started_at         timestamptz not null,
  resting_duration_hours     numeric(8,2) not null
                               check (resting_duration_hours >= 0),
  shippable_at               timestamptz not null,

  notifications_enabled      boolean not null default true,
  completed_at               timestamptz,
  cancelled_at               timestamptz,
  notes                      text
                               check (
                                 notes is null or char_length(notes) <= 500
                               ),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  foreign key (rule_id, variety_id)
    references public.ripening_rules(id, variety_id)
    on update cascade on delete restrict,
  check (
    ethylene_removed_at is null
    or ethylene_removed_at >= ethylene_started_at
  ),
  check (completed_at is null or completed_at >= started_at),
  check (cancelled_at is null or completed_at is null)
);

create index if not exists ripening_batches_staff_idx
  on public.ripening_batches (staff_id);
create index if not exists ripening_batches_variety_idx
  on public.ripening_batches (variety_id);
create index if not exists ripening_batches_location_idx
  on public.ripening_batches (location_id);
create index if not exists ripening_batches_started_idx
  on public.ripening_batches (started_at desc);
create index if not exists ripening_batches_ethylene_check_idx
  on public.ripening_batches (ethylene_ended_at)
  where ethylene_removed_at is null
    and completed_at is null
    and cancelled_at is null;
create index if not exists ripening_batches_shippable_check_idx
  on public.ripening_batches (shippable_at)
  where completed_at is null and cancelled_at is null;

create or replace function public.prepare_ripening_batch()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  selected_rule public.ripening_rules%rowtype;
  selected_variety_name text;
begin
  if tg_op = 'INSERT' then
    new.staff_id := (select auth.uid());
  else
    if old.cancelled_at is not null
       and new.cancelled_at is distinct from old.cancelled_at then
      raise exception 'Cancelled ripening batch cannot be reactivated';
    end if;

    new.id := old.id;
    new.ripening_no := old.ripening_no;
    new.staff_id := old.staff_id;
    new.variety_id := old.variety_id;
    new.rule_id := old.rule_id;
    new.created_at := old.created_at;
  end if;

  if new.staff_id is null then
    raise exception 'Authentication is required';
  end if;

  if tg_op = 'INSERT' then
    if new.rule_id is not null then
      select rule.* into selected_rule
      from public.ripening_rules rule
      where rule.id = new.rule_id
        and rule.variety_id = new.variety_id;

      if not found then
        raise exception 'The ripening rule does not match the selected variety';
      end if;
    else
      select rule.* into selected_rule
      from public.ripening_rules rule
      where rule.variety_id = new.variety_id
        and rule.start_month = extract(
          month from new.started_at at time zone 'Asia/Tokyo'
        )::smallint
        and rule.is_active
      limit 1;

      if found then
        new.rule_id := selected_rule.id;
      end if;
    end if;

    if selected_rule.id is not null then
      new.ethylene_temperature_c := coalesce(
        new.ethylene_temperature_c,
        selected_rule.ethylene_temperature_c
      );
      new.ethylene_processing_hours := coalesce(
        new.ethylene_processing_hours,
        selected_rule.ethylene_duration_hours
      );
      new.resting_temperature_c := coalesce(
        new.resting_temperature_c,
        selected_rule.resting_temperature_c
      );
      new.resting_duration_hours := coalesce(
        new.resting_duration_hours,
        selected_rule.resting_duration_hours
      );
    end if;
  end if;

  if new.ethylene_processing_hours is null then
    raise exception 'Ethylene processing hours are required';
  end if;
  if new.resting_duration_hours is null then
    raise exception 'Resting duration hours are required';
  end if;

  -- 追熟開始 = エチレン開始。以後の予定時刻は時間設定から一意に算出する。
  new.ethylene_started_at := new.started_at;
  new.ethylene_ended_at := new.ethylene_started_at
    + (new.ethylene_processing_hours::double precision * interval '1 hour');
  new.resting_started_at := new.ethylene_ended_at;
  new.shippable_at := new.resting_started_at
    + (new.resting_duration_hours::double precision * interval '1 hour');

  select variety.name into selected_variety_name
  from public.varieties variety
  where variety.id = new.variety_id;

  new.title := '追熟No.' || new.ripening_no::text
    || '_' || to_char(new.started_at at time zone 'Asia/Tokyo', 'YYYY/MM/DD')
    || '_' || coalesce(selected_variety_name, '');
  new.notes := nullif(btrim(new.notes), '');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ripening_batches_prepare on public.ripening_batches;
create trigger ripening_batches_prepare
  before insert or update on public.ripening_batches
  for each row execute function public.prepare_ripening_batch();

comment on table public.ripening_batches is
  '追熟開始時に登録する追熟ロット。予定時刻と実績確認時刻を保持する。';
comment on column public.ripening_batches.ripening_no is
  '画面・帳票で使用する自動採番の追熟No.。';
comment on column public.ripening_batches.rule_id is
  '開始時に参照した月・品種別条件。実際の値は同じ行へスナップショット保存する。';
comment on column public.ripening_batches.ethylene_ended_at is
  'エチレン処理の終了予定日時。';
comment on column public.ripening_batches.ethylene_removed_at is
  'エチレン処理終了を作業者が確認した実績日時。NULLの間は確認待ち。';
comment on column public.ripening_batches.shippable_at is
  'エチレン終了予定 + 寝かせ時間から算出した出荷可能日時。';
comment on column public.ripening_batches.completed_at is
  '出荷可能確認など、追熟作業を完了扱いにした実績日時。';
comment on column public.ripening_batches.cancelled_at is
  '誤登録等でロットを無効化した日時。割当重量は在庫へ戻る。';

-- ===========================================================================
-- ripening_batch_items — 追熟ロットの選果内訳
-- ===========================================================================
create table if not exists public.ripening_batch_items (
  id              uuid primary key default gen_random_uuid(),
  ripening_batch_id uuid not null
                    references public.ripening_batches(id)
                    on update cascade on delete restrict,
  sorting_log_id  uuid not null
                    references public.sorting_logs(id)
                    on update cascade on delete restrict,
  weight_kg       numeric(12,2) not null check (weight_kg > 0),
  is_void         boolean not null default false,
  created_by      uuid not null default auth.uid()
                    references public.profiles(id)
                    on update cascade on delete restrict,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (ripening_batch_id, sorting_log_id)
);

create index if not exists ripening_batch_items_batch_idx
  on public.ripening_batch_items (ripening_batch_id);
create index if not exists ripening_batch_items_sorting_idx
  on public.ripening_batch_items (sorting_log_id)
  where not is_void;

create or replace function public.prepare_ripening_batch_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  batch_variety_id uuid;
  batch_cancelled_at timestamptz;
  source_variety_id uuid;
  source_weight_kg numeric(12,2);
  already_allocated_kg numeric(12,2);
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.id := old.id;
    new.ripening_batch_id := old.ripening_batch_id;
    new.sorting_log_id := old.sorting_log_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if new.created_by is null then
    raise exception 'Authentication is required';
  end if;

  select batch.variety_id, batch.cancelled_at
    into batch_variety_id, batch_cancelled_at
  from public.ripening_batches batch
  where batch.id = new.ripening_batch_id;

  if batch_variety_id is null then
    raise exception 'Ripening batch not found';
  end if;
  if batch_cancelled_at is not null and not new.is_void then
    raise exception 'Cannot allocate sorting inventory to a cancelled batch';
  end if;

  -- 同じ選果ログへの同時割当を直列化し、重量超過を防ぐ。
  perform 1
  from public.sorting_logs sorting
  where sorting.id = new.sorting_log_id
  for update;

  select harvest.variety_id, sorting.weight_kg
    into source_variety_id, source_weight_kg
  from public.sorting_logs sorting
  join public.harvest_logs harvest on harvest.id = sorting.harvest_log_id
  where sorting.id = new.sorting_log_id;

  if source_variety_id is null then
    raise exception 'Sorting log not found';
  end if;
  if source_variety_id <> batch_variety_id then
    raise exception 'Sorting log variety does not match ripening batch variety';
  end if;

  if not new.is_void then
    select coalesce(sum(item.weight_kg), 0)::numeric(12,2)
      into already_allocated_kg
    from public.ripening_batch_items item
    join public.ripening_batches batch
      on batch.id = item.ripening_batch_id
    where item.sorting_log_id = new.sorting_log_id
      and item.id <> new.id
      and not item.is_void
      and batch.cancelled_at is null;

    if already_allocated_kg + new.weight_kg > source_weight_kg then
      raise exception
        'Ripening allocation exceeds sorting weight: available % kg',
        source_weight_kg - already_allocated_kg;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ripening_batch_items_prepare
  on public.ripening_batch_items;
create trigger ripening_batch_items_prepare
  before insert or update on public.ripening_batch_items
  for each row execute function public.prepare_ripening_batch_item();

comment on table public.ripening_batch_items is
  '追熟ロットへ投入した選果ログと重量の内訳。';
comment on column public.ripening_batch_items.is_void is
  '誤登録した内訳を物理削除せず無効化する。無効化した重量は在庫へ戻る。';

-- ===========================================================================
-- 一覧・ダッシュボード用View
-- ===========================================================================
create or replace view public.ripening_rules_expanded
with (security_invoker = true) as
select
  rule.id,
  rule.legacy_id,
  rule.variety_id,
  variety.name as variety_name,
  rule.start_month,
  rule.ethylene_temperature_c,
  rule.ethylene_duration_hours,
  rule.resting_temperature_c,
  rule.resting_duration_hours,
  rule.shelf_life_days,
  rule.shipping_window_days,
  rule.is_active,
  (
    rule.ethylene_duration_hours is not null
    and rule.resting_duration_hours is not null
  ) as is_schedule_configured,
  rule.created_at,
  rule.updated_at
from public.ripening_rules rule
join public.varieties variety on variety.id = rule.variety_id;

comment on view public.ripening_rules_expanded is
  '品種名と、予定時刻の算出に必要な設定済み判定を含む追熟条件一覧。';

-- 選果ログ単位の追熟割当状況。追熟入力時の選択肢・重量超過警告に使用する。
create or replace view public.sorting_ripening_status
with (security_invoker = true) as
select
  sorting.id as sorting_log_id,
  sorting.harvest_log_id,
  harvest.title as harvest_title,
  harvest.variety_id,
  variety.name as variety_name,
  harvest.plot_id,
  plot.name as plot_name,
  sorting.size_standard_id,
  standard.code as size_code,
  standard.display_name as size_name,
  (variety.name || '_' || standard.code || '_' || plot.name) as sorting_title,
  sorting.sorting_date,
  sorting.ethylene_start_deadline,
  sorting.weight_kg as sorted_weight_kg,
  coalesce(
    sum(item.weight_kg) filter (
      where not item.is_void and batch.cancelled_at is null
    ),
    0
  )::numeric(12,2) as ripening_allocated_weight_kg,
  (
    sorting.weight_kg
    - coalesce(
        sum(item.weight_kg) filter (
          where not item.is_void and batch.cancelled_at is null
        ),
        0
      )
  )::numeric(12,2) as available_weight_kg,
  (
    coalesce(
      sum(item.weight_kg) filter (
        where not item.is_void and batch.cancelled_at is null
      ),
      0
    ) > sorting.weight_kg
  ) as is_ripening_over_sorting
from public.sorting_logs sorting
join public.harvest_logs harvest on harvest.id = sorting.harvest_log_id
join public.varieties variety on variety.id = harvest.variety_id
join public.plots plot on plot.id = harvest.plot_id
join public.size_standards standard
  on standard.id = sorting.size_standard_id
left join public.ripening_batch_items item
  on item.sorting_log_id = sorting.id
left join public.ripening_batches batch
  on batch.id = item.ripening_batch_id
group by
  sorting.id,
  sorting.harvest_log_id,
  harvest.title,
  harvest.variety_id,
  variety.name,
  harvest.plot_id,
  plot.name,
  sorting.size_standard_id,
  standard.code,
  standard.display_name,
  sorting.sorting_date,
  sorting.ethylene_start_deadline,
  sorting.weight_kg;

comment on view public.sorting_ripening_status is
  '選果ログごとの選果重量、追熟割当済み重量、追熟へ使用可能な残重量。';

-- 1ロット1行。内訳、現在工程、次回確認時刻、期限警告をまとめて返す。
create or replace view public.ripening_batches_expanded
with (security_invoker = true) as
with item_details as (
  select
    item.ripening_batch_id,
    sum(item.weight_kg)::numeric(12,2) as weight_kg,
    array_agg(
      distinct (variety.name || '_' || standard.code || '_' || plot.name)
    ) as sorting_titles,
    jsonb_agg(
      jsonb_build_object(
        'sorting_log_id', sorting.id,
        'sorting_title',
          (variety.name || '_' || standard.code || '_' || plot.name),
        'harvest_title', harvest.title,
        'size_code', standard.code,
        'weight_kg', item.weight_kg
      )
      order by sorting.sorting_date, sorting.id
    ) as breakdown
  from public.ripening_batch_items item
  join public.sorting_logs sorting on sorting.id = item.sorting_log_id
  join public.harvest_logs harvest on harvest.id = sorting.harvest_log_id
  join public.varieties variety on variety.id = harvest.variety_id
  join public.plots plot on plot.id = harvest.plot_id
  join public.size_standards standard
    on standard.id = sorting.size_standard_id
  where not item.is_void
  group by item.ripening_batch_id
),
batch_state as (
  select
    batch.*,
    case
      when batch.cancelled_at is not null then 'cancelled'
      when batch.completed_at is not null then 'completed'
      when batch.ethylene_removed_at is null
        and now() < batch.ethylene_started_at then 'scheduled'
      when batch.ethylene_removed_at is null then 'ethylene_processing'
      when now() < batch.shippable_at then 'post_ethylene_processing'
      else 'ready_to_ship'
    end as phase,
    case
      when batch.cancelled_at is not null or batch.completed_at is not null
        then null
      when batch.ethylene_removed_at is null then batch.ethylene_ended_at
      else batch.shippable_at
    end as next_check_at,
    case
      when batch.cancelled_at is not null or batch.completed_at is not null
        then null
      when batch.ethylene_removed_at is null then 'ethylene_end'
      else 'shippable'
    end as next_check_type
  from public.ripening_batches batch
)
select
  state.created_at as input_ts,
  state.id as work_record_id,
  state.legacy_id,
  state.staff_id,
  profile.display_name as staff_name,
  state.ripening_no,
  state.title as ripening_title,
  state.location_id,
  location.name as ripening_location,
  state.variety_id,
  variety.name as variety_name,
  state.rule_id,
  coalesce(details.weight_kg, 0)::numeric(12,2) as weight_kg,
  coalesce(details.sorting_titles, array[]::text[]) as sorting_titles,
  coalesce(details.breakdown, '[]'::jsonb) as breakdown,
  state.started_at,
  state.ethylene_temperature_c,
  state.ethylene_started_at,
  state.ethylene_ended_at,
  state.ethylene_processing_hours,
  state.ethylene_removed_at,
  state.resting_temperature_c,
  state.resting_started_at,
  state.resting_duration_hours,
  state.shippable_at,
  extract(
    epoch from (state.shippable_at - state.ethylene_ended_at)
  ) / 3600 as post_ethylene_processing_hours,
  state.notifications_enabled,
  state.phase,
  state.next_check_at,
  state.next_check_type,
  (
    state.phase = 'ethylene_processing'
    and now() >= state.ethylene_started_at
  ) as is_ethylene_processing,
  (
    state.next_check_at is not null and state.next_check_at < now()
  ) as is_overdue,
  (
    state.next_check_at between now() and now() + interval '6 hours'
  ) as is_due_soon,
  case
    when not state.notifications_enabled then 'disabled'
    when state.next_check_at is null then 'none'
    when state.next_check_at < now() then 'overdue'
    when state.next_check_at <= now() + interval '6 hours' then 'due_soon'
    else 'scheduled'
  end as notification_status,
  state.completed_at,
  state.cancelled_at,
  state.notes,
  state.updated_at
from batch_state state
join public.profiles profile on profile.id = state.staff_id
join public.ripening_locations location on location.id = state.location_id
join public.varieties variety on variety.id = state.variety_id
left join item_details details on details.ripening_batch_id = state.id;

comment on view public.ripening_batches_expanded is
  '追熟ロットの担当者、場所、選果内訳、現在工程、次回確認時刻、期限警告を返す。';

-- ===========================================================================
-- Row Level Security
--   anon          : アクセス不可
--   authenticated : 全件参照、自分名義での登録、既存行の共同修正が可能
--   DELETEは許可せず、ロットはcancelled_at、内訳はis_voidで無効化する
-- ===========================================================================
alter table public.ripening_locations enable row level security;
alter table public.ripening_rules enable row level security;
alter table public.ripening_batches enable row level security;
alter table public.ripening_batch_items enable row level security;

drop policy if exists ripening_locations_select on public.ripening_locations;
drop policy if exists ripening_locations_insert on public.ripening_locations;
drop policy if exists ripening_locations_update on public.ripening_locations;
create policy ripening_locations_select on public.ripening_locations
  for select to authenticated using (true);
create policy ripening_locations_insert on public.ripening_locations
  for insert to authenticated with check (true);
create policy ripening_locations_update on public.ripening_locations
  for update to authenticated using (true) with check (true);

drop policy if exists ripening_rules_select on public.ripening_rules;
drop policy if exists ripening_rules_insert on public.ripening_rules;
drop policy if exists ripening_rules_update on public.ripening_rules;
create policy ripening_rules_select on public.ripening_rules
  for select to authenticated using (true);
create policy ripening_rules_insert on public.ripening_rules
  for insert to authenticated with check (true);
create policy ripening_rules_update on public.ripening_rules
  for update to authenticated using (true) with check (true);

drop policy if exists ripening_batches_select on public.ripening_batches;
drop policy if exists ripening_batches_insert_self on public.ripening_batches;
drop policy if exists ripening_batches_update_shared on public.ripening_batches;
create policy ripening_batches_select on public.ripening_batches
  for select to authenticated using (true);
create policy ripening_batches_insert_self on public.ripening_batches
  for insert to authenticated
  with check (staff_id = (select auth.uid()));
create policy ripening_batches_update_shared on public.ripening_batches
  for update to authenticated using (true) with check (true);

drop policy if exists ripening_batch_items_select
  on public.ripening_batch_items;
drop policy if exists ripening_batch_items_insert_self
  on public.ripening_batch_items;
drop policy if exists ripening_batch_items_update_shared
  on public.ripening_batch_items;
create policy ripening_batch_items_select on public.ripening_batch_items
  for select to authenticated using (true);
create policy ripening_batch_items_insert_self on public.ripening_batch_items
  for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy ripening_batch_items_update_shared on public.ripening_batch_items
  for update to authenticated using (true) with check (true);

-- ===========================================================================
-- 最小権限設定（実際に参照できる行はRLSでも制御する）
-- ===========================================================================
revoke all on table
  public.ripening_locations,
  public.ripening_rules,
  public.ripening_batches,
  public.ripening_batch_items,
  public.ripening_rules_expanded,
  public.sorting_ripening_status,
  public.ripening_batches_expanded
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on table
  public.ripening_locations,
  public.ripening_rules,
  public.ripening_batches,
  public.ripening_batch_items
to authenticated;
grant select on table
  public.ripening_rules_expanded,
  public.sorting_ripening_status,
  public.ripening_batches_expanded
to authenticated;
grant usage, select on sequence public.ripening_batches_ripening_no_seq
  to authenticated;

-- トリガー関数はData APIから直接呼び出せないようにする。
revoke execute on function public.prepare_ripening_batch()
  from public, anon, authenticated;
revoke execute on function public.prepare_ripening_batch_item()
  from public, anon, authenticated;

commit;
