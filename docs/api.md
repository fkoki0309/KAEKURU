# APIエンドポイント一覧

| メソッド/パス | 用途 | 認証 |
|---|---|---|
| `GET /t/:token` | QRスキャン時のタグ状態確認・振り分け | 不要 |
| `POST /api/tags/activate` | 持ち主がタグと持ち物を紐付け | 必要 |
| `POST /api/tags/:tagId/unlink` | 紐付け解除(譲渡・再利用) | 必要 |
| `POST /api/owner-pickup-points` | 受取拠点の事前登録 | 必要 |
| `POST /api/return-cases` | 拾得者のフォーム送信(届け方・場所・写真等) | 不要 |
| `POST /api/return-cases/:id/ship` | 郵送ケースの「発送完了」報告 | 不要 |
| `POST /api/return-cases/:id/link-finder` | 拾得者が後からログインして受付番号で紐付け | 必要 |
| `POST /api/return-cases/:id/receive` | 持ち主の「受け取り確認」 | 必要 |
| `POST /api/rewards/:id/pay` | 報酬の送金トリガー | 必要 |

## エンドポイントの補足

### `GET /t/:token`
- タグが存在しない → 404
- `status = unactivated` → 「まだ使われていません」を返す
- `status = active` → フォーム画面用の情報(持ち物名など最低限)を返す

### `POST /api/tags/activate`
- 排他制御の実装は `docs/token-security.md` を参照

### `POST /api/return-cases`
- Body例: `{ tag_token, method: 'dropoff' | 'mail', dropoff_location?, photo_url?, found_location? }`
- `method = 'mail'` の場合、レスポンスに局留め情報(局名・住所・受取人名・`case_code`)を含める。発行ロジックは `docs/anonymous-mail.md` を参照

### `POST /api/return-cases/:id/link-finder`
- 未ログインで送信したケースを、あとから拾得者がログインして自分のものとして紐付ける
- Body例: `{ case_code }`

### `POST /api/return-cases/:id/receive`
- 持ち主が「受け取り確認」ボタンを押した時に呼ぶ
- `finder_user_id` が設定されていれば `rewards` を `pending` → 送金トリガーへ、NULLなら `skipped` にする

## 関連ドキュメント

- テーブル定義: `docs/data-model.md`
- 拾得者フロー: `docs/finder-flow.md`
- 持ち主フロー: `docs/owner-flow.md`
