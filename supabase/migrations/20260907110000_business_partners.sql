-- Business partner master imported from 取引先マスタ_ext.xlsx.
-- Source notes and spelling are preserved verbatim for traceability.

begin;

create table if not exists public.business_partners (
  id uuid primary key default gen_random_uuid(),
  legacy_id text not null unique check (btrim(legacy_id) <> ''),
  name text not null check (btrim(name) <> ''),
  short_name text not null check (btrim(short_name) <> ''),
  free_registration_note text,
  postal_code text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_partners_short_name_idx
  on public.business_partners (lower(btrim(short_name)));

drop trigger if exists business_partners_set_updated_at
  on public.business_partners;
create trigger business_partners_set_updated_at
  before update on public.business_partners
  for each row execute function public.set_updated_at();

insert into public.business_partners (
  legacy_id,
  name,
  short_name,
  free_registration_note,
  postal_code,
  address
) values
  ('d2aec550', '一般社団法人東の食の会', '東の食の会', '済', null, null),
  ('9bf1fc19', '一般社団法人Dream Forest Supporters', '児童クラブ', '済', null, null),
  ('2fb2e196', '公益財団法人福島県観光物産交流協会', '公益財団法人福島県観光物産交流協会', '済', null, null),
  ('6d60d533', '読売エージェンシー', '読売エージェンシー', '済（株式会社読売アルスA）', null, null),
  ('b53e51f8', '一般社団法人おおくままちづくり公社', 'まちづくり公社', '済', null, null),
  ('3719c398', '株式会JTB', 'JTB', '済（株式会社JTB）', null, null),
  ('4dfce80c', '株式会社しのや', 'しのや', '済', null, null),
  ('9ae61532', '仙台ｒｅｂｏｒｎ', 'マルシェリアン', '済（仙台reborn株式会社）', null, null),
  ('e5ee5788', 'ReFruits(自社)', 'ReFruits(自社)', null, null, null),
  ('bfc60149', '高林果実店', '高林果実店', '済', null, null),
  ('1d8f1938', 'EC注文', 'EC注文', null, null, null),
  ('51316e2b', '株式会社マルト商事', 'マルト', '済', '〒970-8026', '〒970-8026 福島県いわき市平尼子町３−１−１'),
  ('25d4f929', '株式会社流通研究所', '野菜や金次郎', '済', null, null),
  ('0a12360d', '株式会社双葉事務器', 'ふたば文具', '済', null, null),
  ('2f70c8f2', '東北技研工業株式会社', 'デイリー(東北技研', '済', null, null),
  ('5057fe5b', '株式会社タイズスタイル', 'Rinka', '済', null, null),
  ('c670d869', '株式会社ナニワヤ', 'ナニワヤ', '済', null, null),
  ('15bce64e', 'ナショナル麻布', 'ナショナル麻布', '済（これでいい？）', null, null),
  ('5d795f40', '花京院市場', '花京院市場', '済', null, null),
  ('31c7da03', '霞ヶ関珈琲', '霞ヶ関珈琲', '無視', null, null),
  ('9aed519a', '公益財団法人福島県観光物産交流協会', '福島県観光物産館/コラッセ福島', '４行目で済', null, null),
  ('efbd7037', '株式会社Oriai', 'panier', '済', null, null),
  ('a0bf1096', '道の駅四倉港', '道の駅四倉港', '済', null, null),
  ('e66edb5a', '一般社団法人まちづくりなみえ', '道の駅なみえ', '済', null, null),
  ('d29da250', '一般社団法人楢葉町振興公社', '道の駅楢葉', '済', null, null),
  ('3c23af68', '株式会社イエローページセタガヤ', 'イエローページセタガヤ', '済', null, null),
  ('8a8eea5e', 'open roastery Alu.', 'open roastery Alu.', '済', null, null),
  ('915de9bf', '（株）福島インフォメーションリサーチ＆マネジメント', '福島インフォメーションリサーチ＆マネジメント', '済', null, null),
  ('8e918a8c', '株式会社向山製作所', '向山製作所', '済', null, null),
  ('cd86f9bd', '株式会社野馬追の里', '道の駅南相馬', '済', null, null),
  ('e5359f03', '株式会社野馬追の里', 'セデッテ鹿島SA', '済（上の行で）', null, null),
  ('84794274', '株式会社エシカルスピリッツ', 'エシカルスピリッツ(東京蔵前のレストラン', '済', null, null)
on conflict (legacy_id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  free_registration_note = excluded.free_registration_note,
  postal_code = excluded.postal_code,
  address = excluded.address;

alter table public.business_partners enable row level security;

drop policy if exists business_partners_select
  on public.business_partners;
drop policy if exists business_partners_insert
  on public.business_partners;
drop policy if exists business_partners_update
  on public.business_partners;

create policy business_partners_select
  on public.business_partners
  for select to authenticated using (true);
create policy business_partners_insert
  on public.business_partners
  for insert to authenticated with check (true);
create policy business_partners_update
  on public.business_partners
  for update to authenticated using (true) with check (true);

revoke all on table public.business_partners
  from public, anon, authenticated;
grant select, insert, update on table public.business_partners
  to authenticated;

comment on table public.business_partners is
  '取引先マスタ。初期データは取引先マスタ_ext.xlsxから移行。';
comment on column public.business_partners.free_registration_note is
  '元ファイルの「フリーに登録」列。移行確認用の原文メモ。';

commit;
