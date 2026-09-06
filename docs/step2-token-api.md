# STEP2: QRトークン発行・アクティベーション API 仕様

目的: QRシールに埋め込むトークンの安全な発行と、持ち主によるアクティベーション（タグ＋持ち物の紐付け）を実装する。

設計方針
- トークンは暗号学的乱数（URL-safe）で生成し、DB `tags.token` に一意制約を置く。
- 発行は管理コマンド/バッチまたは生産ロット単位で行い、発行時は `status = 'unactivated'` にする。
- アクティベーションは持ち主認証を必須にし、排他制御（トランザクション＋行ロック）で二重アクティベートを防止する。
- トークンの再発行や無効化は `status` を更新して扱う（`suspended` など）。

エンドポイント

1) POST /api/tags/issue
- 用途: 管理者/発行バッチがトークンを発行する（通常は内部運用で、公開APIではない）
- 認証: 管理者
- Body: `{ count: number, lot_id?: string, sales_channel?: string }`
- Response: `{ tokens: ["abc...", ...] }`
- 備考: レート制限、重複チェック。大量発行はバッチ実行で。

2) GET /a/:token
- 用途: QR スキャン時にタグ状態を確認して UI を振り分ける（`docs/api.md` に準拠）
- 認証: 不要
- Response 例:
  - 404: 存在しない
  - 200 (unactivated): `{ status: 'unactivated' }`
  - 200 (active): `{ status: 'active', tagId, item_name?, owner_public_info? }`

3) POST /api/tags/activate
- 用途: 持ち主がログインしてタグを自身の持ち物として登録（アクティベーション）する
- 認証: 必須（Supabase Auth など）
- Body: `{ token: string, item_name?: string, item_photo_url?: string }`
- Response: Success: `{ tagId, owner_relation_id }` or Error with reason

アクティベーションの実装要点
- フロー:
  1. リクエスト受信（認証済みユーザー）
  2. トランザクション開始
  3. SELECT id, status FROM tags WHERE token = $1 FOR UPDATE
  4. エラーパス: tag not found -> 404
  5. status != 'unactivated' -> 409 (already activated or suspended)
  6. tags.status を 'active' に更新
  7. tag_owners テーブルに新しい所有レコードを追加 (activated_at = now())
  8. トランザクション終了（コミット）
- 理由: `FOR UPDATE` による行ロックで同時アクティベート競合を防止
- Idempotency: 同じユーザーが複数回送信しても二重登録にならないよう、`tag_owners` 挿入時は `unlinked_at IS NULL` の既存レコードがないことを検査
- 監査ログ: アクティベーション成功/失敗をログに記録

セキュリティ
- トークンは推測不可能にする（例: Node.js の `crypto.randomBytes(24)` を base64url エンコード）
- トークンは短期間で使い捨てにする必要はないが、紛失・悪用検知のため `suspended` 更新フローを用意
- アクティベーションは CSRF/認証保護を行う（API トークンを使用）
- 監査: アクティベーション要求 IP/ユーザーを記録
- 参考: `docs/token-security.md` を参照

エラーコード
- 400: バリデーションエラー
- 401: 未認証（アクティベーション時）
- 404: token not found
- 409: token already activated / race
- 500: サーバーエラー

運用メモ
- 発行バッチは `lot_id` を紐づけて管理
- 発行済みトークンの在庫管理ダッシュボードを用意すると便利
- 監査とアラート: 異常なアクティベーション頻度はアラートを上げる

次の実装候補（提示）
- Next.js の API ルート `src/app/api/tags/activate/route.ts` の骨子を実装する
- Prisma スキーマを `schema.prisma` に落とし込み、マイグレーションを作成する

必要なら、どちらを先に実装するか指示ください。