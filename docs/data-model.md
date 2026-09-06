# データモデル(DB設計)

タグの実体(`tags`)と所有関係(`tag_owners`)を分離し、譲渡・再アクティベーションに対応する。

```sql
-- QRタグの実体
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,       -- QRに埋め込む文字列(暗号学的乱数)
    status VARCHAR(20) NOT NULL DEFAULT 'unactivated',
        -- unactivated / active / suspended
    lot_id UUID REFERENCES production_lots(id),
    sales_channel VARCHAR(20),               -- 'own_ec' / 'amazon_fba' / 'amazon_fbm'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 所有関係(現オーナー・履歴)
CREATE TABLE tag_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES tags(id),
    user_id UUID REFERENCES users(id),
    item_name VARCHAR(100),
    item_photo_url TEXT,
    activated_at TIMESTAMPTZ,
    unlinked_at TIMESTAMPTZ                  -- NULLなら現役の所有関係
);

-- 持ち主の受取拠点(局留め用の事前登録)
CREATE TABLE owner_pickup_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    carrier VARCHAR(20),                     -- 'japan_post' / 'yamato'
    facility_name VARCHAR(100),              -- 例: '渋谷郵便局'
    facility_address TEXT,                   -- 局の住所(拾得者に開示してよい公開情報)
    recipient_name VARCHAR(50),              -- 局留め用の受取人名
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 拾得〜返却の1ケース
CREATE TABLE return_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES tags(id),
    method VARCHAR(20),                      -- 'dropoff' / 'mail'
    dropoff_location TEXT,                   -- 'dropoff' の場合の届け先
    pickup_point_id UUID REFERENCES owner_pickup_points(id), -- 'mail' の場合
    case_code VARCHAR(20) UNIQUE,            -- 例: 'FND-7K2X9M'
    finder_photo_url TEXT,
    finder_memo TEXT,
    found_location TEXT,
    finder_user_id UUID REFERENCES users(id), -- 匿名ならNULL、ログインすれば紐付け
    status VARCHAR(20) DEFAULT 'submitted',
        -- submitted / shipped / received / expired
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,                  -- 局留めの保管期限
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 報酬の支払い
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_case_id UUID REFERENCES return_cases(id),
    amount INTEGER DEFAULT 1000,
    status VARCHAR(20) DEFAULT 'pending',    -- pending / paid / skipped
    paid_at TIMESTAMPTZ
);
```

## テーブルの関係

- `tags` 1 : N `tag_owners`(譲渡があるため履歴として複数持つ。有効なのは `unlinked_at IS NULL` の1件のみ)
- `tags` 1 : N `return_cases`(同じタグが複数回拾得されうる)
- `owner_pickup_points` 1 : N `return_cases`(郵送の場合のみ紐づく)
- `return_cases` 1 : 1 `rewards`

## 関連ドキュメント

- トークン発行・排他制御の方針: `docs/token-security.md`
- 各テーブルを操作するAPI: `docs/api.md`
