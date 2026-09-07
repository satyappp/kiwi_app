-- Sync the production variety identifiers with the current Google Sheets
-- 「品種マスタ / 品種マスタ_マスタ」 source.
--
-- Temporary non-kiwi rows whose names end in 「(仮)」 are intentionally not
-- imported. Existing UUID relationships remain unchanged; only legacy_code is
-- corrected/backfilled for interoperability with the source sheet.

begin;

update public.varieties as variety
set
  legacy_code = source.legacy_code,
  updated_at = now()
from (
  values
    ('紅妃',                    'be188951'),
    ('さぬきキウイっこ1号',     'ee6bfdb9'),
    ('香緑',                    '77794d93'),
    ('ヘイワード',              '651ae19b'),
    ('東京ゴールド',            'da62169f'),
    ('さぬきキウイっこ5号',     '1d4a4a8d'),
    ('ミニ香緑(第一)',           '7b957014'),
    ('シカクイキウイ',          '2ff54c56'),
    ('YN7',                     '78a4a4b0'),
    ('YN11',                    '1ffd5172'),
    ('センセーションアップル',  'ddfd6bb5'),
    ('ジャンボイエロー',        '6beafca7'),
    ('ゴールドおおくま',        '6ccb4093'),
    ('香緑_加工用',             'fde29e2f')
) as source(variety_name, legacy_code)
where lower(btrim(variety.name)) = lower(btrim(source.variety_name))
  and variety.legacy_code is distinct from source.legacy_code;

commit;
