-- ============================================================================
-- キウイ農園 — sorting（選果作業ログ）schema
--
-- 20260901120000_harvest_schema.sql の後に実行する。
-- このファイル全体をSupabase SQL Editorへ貼り付けて実行する。
-- 同じ内容を複数回実行しても安全な構成にしている。
--
-- 1回の登録で「元の収穫・重量・サイズ」を1件記録する。
-- 選果日、エチレン開始期限、担当者、入力日時はDB側で自動設定する。
-- ============================================================================

begin;

-- ===========================================================================
-- 以前の検討版を安全に整理する
-- ===========================================================================
drop view if exists public.sorting_inventory;
drop view if exists public.harvest_sorting_status;
drop view if exists public.sorting_batches_expanded;
drop view if exists public.sorting_batch_totals;

do $$
declare
  old_data_exists boolean := false;
begin
  if to_regclass('public.sorting_items') is not null then
    execute 'select exists (select 1 from public.sorting_items)'
      into old_data_exists;
  end if;

  if not old_data_exists
     and to_regclass('public.sorting_batches') is not null then
    execute 'select exists (select 1 from public.sorting_batches)'
      into old_data_exists;
  end if;

  if old_data_exists then
    raise exception
      '旧選果テーブルにデータがあります。移行方法を決めてから再実行してください。';
  end if;
end;
$$;

drop table if exists public.sorting_items;
drop table if exists public.sorting_batches;
drop function if exists public.prepare_sorting_item();
drop function if exists public.prepare_sorting_batch();

-- ===========================================================================
-- size_standards — サイズ・規格マスタ
-- サイズを固定カラムではなく行として管理する。
-- 現在の5L〜SSを保持しながら、将来的な規格の追加・停止に対応できる。
-- ===========================================================================
create table if not exists public.size_standards (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique check (btrim(code) <> ''),
  display_name text not null check (btrim(display_name) <> ''),
  is_active    boolean not null default true,
  sort_order   integer not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_size_standards_updated_at on public.size_standards;
create trigger trg_size_standards_updated_at
  before update on public.size_standards
  for each row execute function public.set_updated_at();

insert into public.size_standards (code, display_name, sort_order) values
  ('5L', '5L', 10),
  ('4L', '4L', 20),
  ('3L', '3L', 30),
  ('LL', 'LL', 40),
  ('L',  'L',  50),
  ('M',  'M',  60),
  ('S',  'S',  70),
  ('SS', 'SS', 80)
on conflict (code) do update set
  display_name = excluded.display_name,
  sort_order = excluded.sort_order;

comment on table public.size_standards is
  '選果で使用するサイズ・規格マスタ。5L〜SSを初期値として保持する。';
comment on column public.size_standards.code is
  'システム内で一意なサイズコード（例：5L、LL、S）。';
comment on column public.size_standards.display_name is
  '画面に表示するサイズ・規格名。';
comment on column public.size_standards.is_active is
  '新規入力の選択肢として使用できるか。過去データは無効化後も保持する。';
comment on column public.size_standards.sort_order is
  '画面や一覧での表示順。小さい値を先に表示する。';

-- ===========================================================================
-- sorting_logs — 選果作業ログ
--
-- 人が選ぶ・入力する値：
--   harvest_log_id   元の収穫データ
--   weight_kg        選果した重量（kg）
--   size_standard_id サイズ・規格
--
-- DBが自動設定する値：
--   id、staff_id、sorting_date、ethylene_start_deadline、created_at
--
-- 品種・園地・収穫タイトル・選果期限はharvest_log_idから引き継ぐ。
-- ===========================================================================
create table if not exists public.sorting_logs (
  id                      uuid primary key default gen_random_uuid(),
  legacy_id               text unique,

  harvest_log_id          uuid not null
                            references public.harvest_logs(id)
                            on update cascade on delete restrict,
  staff_id                uuid not null default auth.uid()
                            references public.profiles(id)
                            on update cascade on delete restrict,
  size_standard_id        uuid not null
                            references public.size_standards(id)
                            on update cascade on delete restrict,

  sorting_date            date not null
                            default ((now() at time zone 'Asia/Tokyo')::date),
  weight_kg               numeric(12,2) not null
                            check (weight_kg > 0),
  ethylene_start_deadline date not null
                            default (
                              ((now() at time zone 'Asia/Tokyo')::date + 14)
                            ),

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists sorting_logs_harvest_idx
  on public.sorting_logs(harvest_log_id);
create index if not exists sorting_logs_staff_idx
  on public.sorting_logs(staff_id);
create index if not exists sorting_logs_size_idx
  on public.sorting_logs(size_standard_id);
create index if not exists sorting_logs_date_idx
  on public.sorting_logs(sorting_date desc);
create index if not exists sorting_logs_ethylene_deadline_idx
  on public.sorting_logs(ethylene_start_deadline);

-- 担当者・選果日・エチレン開始期限をクライアント入力に依存させない。
-- 更新時にも元の収穫、担当者、入力日時、自動設定した日付は変更させない。
create or replace function public.prepare_sorting_log()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.staff_id := (select auth.uid());
    new.sorting_date := (now() at time zone 'Asia/Tokyo')::date;
    new.ethylene_start_deadline := new.sorting_date + 14;
  else
    new.id := old.id;
    new.harvest_log_id := old.harvest_log_id;
    new.staff_id := old.staff_id;
    new.sorting_date := old.sorting_date;
    new.ethylene_start_deadline := old.ethylene_start_deadline;
    new.created_at := old.created_at;
  end if;

  if new.staff_id is null then
    raise exception 'Authentication is required';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sorting_logs_prepare on public.sorting_logs;
create trigger sorting_logs_prepare
  before insert or update on public.sorting_logs
  for each row execute function public.prepare_sorting_log();

comment on table public.sorting_logs is
  '選果作業ログ。1行につき1つの収穫・サイズ・重量を記録する。';
comment on column public.sorting_logs.legacy_id is
  '旧スプレッドシートのID。将来のデータ移行で使用する。';
comment on column public.sorting_logs.harvest_log_id is
  '選果元となる収穫ログ。品種・園地・収穫タイトル・選果期限を引き継ぐ。';
comment on column public.sorting_logs.staff_id is
  '登録担当者。ログイン中のユーザーをDB側で自動設定する。';
comment on column public.sorting_logs.size_standard_id is
  'プルダウンで選択したサイズ・規格。';
comment on column public.sorting_logs.sorting_date is
  '選果日。登録時の日本時間の日付をDB側で自動設定する。';
comment on column public.sorting_logs.weight_kg is
  '選択したサイズへ選果された重量（kg）。';
comment on column public.sorting_logs.ethylene_start_deadline is
  'エチレン処理開始期限。登録日の14日後をDB側で自動設定する。';
comment on function public.prepare_sorting_log() is
  '選果ログの担当者・日付・監査項目をDB側で設定・保護するトリガー関数。';

-- ===========================================================================
-- 一覧・集計用View
-- ===========================================================================

-- 一覧表示・CSV出力向け。収穫から引き継ぐ情報もまとめて返す。
create or replace view public.sorting_logs_expanded
with (security_invoker = true) as
select
  s.created_at as input_ts,
  s.id as work_record_id,
  s.legacy_id,
  s.staff_id,
  pr.display_name as staff_name,
  s.sorting_date,
  s.harvest_log_id,
  h.title as harvest_title,
  h.plot_id,
  pl.name as plot_name,
  h.variety_id,
  v.name as variety_name,
  h.sorting_deadline,
  s.size_standard_id,
  standards.code as size_code,
  standards.display_name as size_name,
  s.weight_kg,
  s.ethylene_start_deadline,
  s.updated_at
from public.sorting_logs s
join public.harvest_logs h on h.id = s.harvest_log_id
join public.profiles pr on pr.id = s.staff_id
join public.plots pl on pl.id = h.plot_id
join public.varieties v on v.id = h.variety_id
join public.size_standards standards on standards.id = s.size_standard_id;

comment on view public.sorting_logs_expanded is
  '担当者、収穫タイトル、品種、園地、期限、サイズを含む選果作業一覧。';

-- 収穫ごとの選果済み重量を集計し、収穫量超過を警告する。
create or replace view public.harvest_sorting_status
with (security_invoker = true) as
select
  h.id as harvest_log_id,
  h.title as harvest_title,
  h.weight_kg as harvested_weight_kg,
  coalesce(sum(s.weight_kg), 0)::numeric(12,2) as sorted_weight_kg,
  (h.weight_kg - coalesce(sum(s.weight_kg), 0))::numeric(12,2)
    as remaining_unsorted_kg,
  (coalesce(sum(s.weight_kg), 0) > h.weight_kg)
    as is_sorting_over_harvest
from public.harvest_logs h
left join public.sorting_logs s on s.harvest_log_id = h.id
group by h.id, h.title, h.weight_kg;

comment on view public.harvest_sorting_status is
  '収穫量、選果済み重量、未選果重量、収穫量超過警告。';

-- 品種・園地・サイズ・エチレン開始期限ごとの選果済み在庫。
create or replace view public.sorting_inventory
with (security_invoker = true) as
select
  h.variety_id,
  v.name as variety_name,
  h.plot_id,
  pl.name as plot_name,
  s.size_standard_id,
  standards.code as size_code,
  s.ethylene_start_deadline,
  (v.name || '_' || standards.code || '_' || pl.name) as sorting_title,
  sum(s.weight_kg)::numeric(12,2) as sorted_weight_kg,
  max(s.updated_at) as last_updated_at
from public.sorting_logs s
join public.harvest_logs h on h.id = s.harvest_log_id
join public.varieties v on v.id = h.variety_id
join public.plots pl on pl.id = h.plot_id
join public.size_standards standards on standards.id = s.size_standard_id
group by
  h.variety_id,
  v.name,
  h.plot_id,
  pl.name,
  s.size_standard_id,
  standards.code,
  standards.sort_order,
  s.ethylene_start_deadline;

comment on view public.sorting_inventory is
  '品種・園地・サイズ・エチレン開始期限ごとの選果済み重量。';

-- ===========================================================================
-- Row Level Security
--   anon          ：アクセス不可
--   authenticated ：全件参照、自分名義での登録、既存行の修正が可能
--   DELETE権限・ポリシーは作らず、作業ログを物理削除させない
-- ===========================================================================
alter table public.size_standards enable row level security;
alter table public.sorting_logs enable row level security;

drop policy if exists size_standards_select on public.size_standards;
drop policy if exists size_standards_insert on public.size_standards;
drop policy if exists size_standards_update on public.size_standards;
create policy size_standards_select on public.size_standards
  for select to authenticated using (true);
create policy size_standards_insert on public.size_standards
  for insert to authenticated with check (true);
create policy size_standards_update on public.size_standards
  for update to authenticated using (true) with check (true);

drop policy if exists sorting_logs_select on public.sorting_logs;
drop policy if exists sorting_logs_insert_self on public.sorting_logs;
drop policy if exists sorting_logs_update_shared on public.sorting_logs;
create policy sorting_logs_select on public.sorting_logs
  for select to authenticated using (true);
create policy sorting_logs_insert_self on public.sorting_logs
  for insert to authenticated
  with check (staff_id = (select auth.uid()));
create policy sorting_logs_update_shared on public.sorting_logs
  for update to authenticated using (true) with check (true);

-- ===========================================================================
-- 最小権限設定（実際に参照できる行はRLSでも制御する）
-- ===========================================================================
revoke all on table
  public.size_standards,
  public.sorting_logs,
  public.sorting_logs_expanded,
  public.harvest_sorting_status,
  public.sorting_inventory
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update on table
  public.size_standards,
  public.sorting_logs
to authenticated;
grant select on table
  public.sorting_logs_expanded,
  public.harvest_sorting_status,
  public.sorting_inventory
to authenticated;

-- トリガー関数はData APIから直接呼び出せないようにする。
revoke execute on function public.prepare_sorting_log()
  from public, anon, authenticated;

commit;
