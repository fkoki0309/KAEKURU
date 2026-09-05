STEP2 サンプル実装について

追加ファイル:
- src/app/api/tags/activate/route.ts  (POST)
- src/app/a/[token]/route.ts           (GET)
- src/lib/prisma.ts                    (Prisma client helper)

使い方(ローカル確認用の簡易手順):
1. Prisma と Next.js のセットアップを行い、`prisma` クライアントを用意してください。
2. 環境変数に DB 接続文字列を設定し、`npm install` で依存を入れてください。
3. API を起動して以下を叩きます。

例: タグ状態確認
```
GET /a/<token>
```

例: アクティベーション (簡易: ヘッダで user id を渡す)
```
POST /api/tags/activate
Content-Type: application/json
Headers:
  x-sample-user-id: <user-uuid>
Body:
  { "token": "...", "item_name": "My Bottle" }
```

注: サンプルは認証を簡略化しています。本番では Supabase Auth 等で認証を必須にし、CSRF/セキュリティ対策を行ってください。
