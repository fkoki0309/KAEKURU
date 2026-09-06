開発セットアップ

1. 依存インストール

```bash
npm install
```

2. 環境変数設定

```bash
cp .env.example .env
# 編集して DATABASE_URL 等を設定
```

3. Prisma の生成とマイグレーション

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio        # データ確認
npm run dev
```

注意: 本リポジトリは Supabase を想定した設計です。認証は Supabase Auth で実装する予定です。

Mock モード
- `DATABASE_URL` が設定されていない場合、サーバは簡易モック実装を使って動作します。
- 既定で `demo-token-123`（未登録）と `demo-token-activated`（登録済み）をシードしています。
- モック確認例:

```bash
curl http://localhost:3000/a/demo-token-123
curl -X POST http://localhost:3000/api/tags/activate -H "Content-Type: application/json" -H "x-sample-user-id: mock-user" -d '{"token":"demo-token-123","item_name":"My Mug"}'
```

Prisma 初期化エラー
- `@prisma/client did not initialize yet` というエラーが出た場合、`npx prisma generate` を実行してクライアントを生成してください。
- もし `DATABASE_URL` を設定しているが `npx prisma generate` をまだ実行していない場合、API ルートは明示的なエラーを返します。

