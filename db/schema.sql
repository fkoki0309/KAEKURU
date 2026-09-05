-- DB schema for KAEKURU (derived from docs/data-model.md)

-- QRタグの実体
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unactivated',
    lot_id UUID REFERENCES production_lots(id),
    sales_channel VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 所有関係(現オーナー・履歴)
CREATE TABLE IF NOT EXISTS tag_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES tags(id),
    user_id UUID REFERENCES users(id),
    item_name VARCHAR(100),
    item_photo_url TEXT,
    activated_at TIMESTAMPTZ,
    unlinked_at TIMESTAMPTZ
);

-- 持ち主の受取拠点(局留め用の事前登録)
CREATE TABLE IF NOT EXISTS owner_pickup_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    carrier VARCHAR(20),
    facility_name VARCHAR(100),
    facility_address TEXT,
    recipient_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 拾得〜返却の1ケース
CREATE TABLE IF NOT EXISTS return_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID REFERENCES tags(id),
    method VARCHAR(20),
    dropoff_location TEXT,
    pickup_point_id UUID REFERENCES owner_pickup_points(id),
    case_code VARCHAR(20) UNIQUE,
    finder_photo_url TEXT,
    finder_memo TEXT,
    found_location TEXT,
    finder_user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'submitted',
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 報酬の支払い
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_case_id UUID REFERENCES return_cases(id),
    amount INTEGER DEFAULT 1000,
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMPTZ
);

-- インデックスや制約はマイグレーション段階で追加してください。
