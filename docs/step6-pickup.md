# STEP6: 匿名お届け先(局留め)発行

目的: 拾得者が返却依頼を行った後、匿名で受け取り用の局留めコード（pickup point）を発行して持ち主に伝えるためのロジックと表示を実装する。

エンドポイント

- `POST /api/pickup-points/anonymous`
  - Body: `{ "return_case_id": "rc-...", "days_valid": 14 }`
  - モック動作: `public` モード（`DATABASE_URL` 未設定）では `mockDb` に保存される。
  - レスポンス: `{ ok: true, pickup_point: { id, return_case_id, code, expires_at, created_at } }`

動作確認

1) まず `POST /api/return-cases` で返却申請を作成し、`return_case.id` を取得する。
2) 次に pickup point を作成:

```bash
curl -X POST http://localhost:3000/api/pickup-points/anonymous \
  -H "Content-Type: application/json" \
  -d '{"return_case_id":"rc-abc123","days_valid":14}' | jq .
```

期待: `{ ok: true, pickup_point: { code: "KP-XXXXX", expires_at: "..." }}` が返る。

備考

- 本番では Supabase や任意のストレージに保存し、局留めの受け取りフロー（持ち主にコード通知、受け取り時の確認）を実装してください。
- この実装はモック中心で、実DBパスは 501 を返します。DB モデルが整ったら Prisma マイグレーションを追加してください。
