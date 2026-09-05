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
```

4. 開発サーバ起動

```bash
npm run dev
```

注意: 本リポジトリは Supabase を想定した設計です。認証は Supabase Auth で実装する予定です。
