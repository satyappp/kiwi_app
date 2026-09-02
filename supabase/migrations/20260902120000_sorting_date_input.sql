-- ============================================================================
-- キウイ農園 — allow an editable sorting date
--
-- 20260901130000_sorting_schema.sql の後に実行する。
-- 選果日を画面で選択できるようにし、エチレン開始期限は選択日の14日後にする。
-- 既存行は更新せず、新規登録時のトリガー動作だけを変更する。
-- ============================================================================

begin;

create or replace function public.prepare_sorting_log()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.staff_id := (select auth.uid());
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

comment on column public.sorting_logs.sorting_date is
  '選果日。画面では当日を初期値とし、作業者が別の日付を選択できる。';
comment on column public.sorting_logs.ethylene_start_deadline is
  'エチレン処理開始期限。選択した選果日の14日後をDB側で自動設定する。';
comment on function public.prepare_sorting_log() is
  '選果ログの担当者・監査項目を設定し、選果日からエチレン開始期限を算出するトリガー関数。';

commit;
