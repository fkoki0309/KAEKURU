# KAEKURU

QR付きシールで持ち物と持ち主を紐付け、拾得者が匿名で届け出て持ち主が報酬を払う忘れ物管理アプリ。

- 拾得者はログイン不要。QRを読み取ってフォームに届け出るだけ。
- 持ち主は住所・連絡先を明かさずに受け取れる(局留めベースの匿名配送)。

## 技術構成

Next.js (App Router / TypeScript)。DB は Supabase(PostgreSQL)+ Prisma を想定。
詳細は [`docs/tech-stack.md`](docs/tech-stack.md)。

## 開発

```bash
npm install
npm run dev            # http://localhost:3000
```

### モックモード

`DATABASE_URL` が未設定なら、`src/lib/mockDb.ts` の簡易インメモリ実装で動きます
(状態は `tmp/mockDb.json` に保存 — gitignore 済み)。

- シードタグ: `demo-token-123`(未登録)/ `demo-token-activated`(登録済み)
- 持ち主ログイン: `test` / `test`
- 状態をリセットしたいときは `rm -rf tmp .next` してから `npm run dev`

一連のデモ手順は [`demo/DEMO.md`](demo/DEMO.md)。

### 実 DB モード

```bash
cp .env.example .env   # DATABASE_URL を設定
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## ドキュメント

| ファイル | 内容 |
|---|---|
| [`docs/overview.md`](docs/overview.md) | 概要・登場人物・全体フロー(最初に読む) |
| [`docs/finder-flow.md`](docs/finder-flow.md) | 拾得者フロー |
| [`docs/owner-flow.md`](docs/owner-flow.md) | 持ち主フロー |
| [`docs/data-model.md`](docs/data-model.md) | DBスキーマ |
| [`docs/token-security.md`](docs/token-security.md) | QRトークン設計・セキュリティ |
| [`docs/api.md`](docs/api.md) | APIエンドポイント一覧 |
| [`docs/anonymous-mail.md`](docs/anonymous-mail.md) | 匿名お届け先(局留め) |
| [`docs/tech-stack.md`](docs/tech-stack.md) | 技術選定 |
| [`docs/git-flow.md`](docs/git-flow.md) | Git運用ルール |
| [`docs/open-issues.md`](docs/open-issues.md) | 未解決の論点 |
