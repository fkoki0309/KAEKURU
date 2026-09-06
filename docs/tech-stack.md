# 技術選定

## 選定内容

| レイヤー | 選定 | 理由 |
|---|---|---|
| フロントエンド/バックエンド | Next.js(TypeScript) | フォーム中心のUIとAPIを1リポジトリで完結できる。拾得者側はSSRで初期表示を軽くできる |
| DB | **Supabase(PostgreSQL)** | マネージドPostgres。既存のDB設計(UUID, TIMESTAMPTZ, トランザクション+行ロック)がPostgres前提の書き方になっている |
| ORM | Prisma | スキーマ管理・マイグレーションがコード化でき、TypeScriptとの相性が良い |
| 認証 | Supabase Auth | DBと同じSupabaseプロジェクト内で完結させ、構成をシンプルにする。持ち主のみログインが必要という要件に対応 |
| ホスティング | Vercel(アプリ)+ Supabase(DB/Auth) | サーバー管理不要で立ち上げが速い |
| 画像ストレージ | Supabase Storage | 拾得者の発見時写真の保存。DB/認証と同じ基盤にまとめて運用をシンプルにする |
| メール送信 | SendGrid | 通知はメール主軸で実装する先。到達率の実績が豊富 |
| 報酬送金 | Kyash法人送金サービス(要見積もり) or Stripe Connect | 手数料の見積もり結果次第で正式採用を決定 |
| QRコード生成 | `qrcode`(npmパッケージ) | 外部APIを使わず自前生成可能。印刷用にSVG/PNG出力ができる |
| 郵便番号/拠点検索 | zipcloud + Google Places API | 拠点登録フォームの入力補助・郵便局検索 |
| Web Push(補助) | Firebase Cloud Messaging | Android/Chromeのみの補助的な通知として。iOS Safariはメールが主軸 |

## 構成イメージ

```
Next.js (TypeScript) on Vercel
 ├─ /app/t/[token]        拾得者向けページ(SSR、ログイン不要)
 ├─ /app/owner/...        持ち主向けダッシュボード(要認証)
 ├─ /app/api/...          APIルート(tags, return-cases, rewards 等)
 └─ Prisma
      └─ Supabase
           ├─ PostgreSQL(データ本体)
           ├─ Supabase Auth(持ち主のログイン)
           └─ Supabase Storage(発見時写真)
      + SendGrid(メール通知)
      + Kyash / Stripe Connect(報酬送金)
      + qrcode(QR生成、npmパッケージ)
```

## 選定のポイント

- Next.js 1本で拾得者フォームと持ち主ダッシュボードを同じコードベースで管理し、`docs/api.md` のエンドポイント設計をAPIルートにそのまま落とし込む
- **DB・認証・画像ストレージをSupabaseに集約**することで、外部サービスの数を減らし、初期構築と運用の負荷を下げる
- 決済(Kyash/Stripe)以外は概ね無料枠内で開発を始められる構成

## 関連ドキュメント

- DBスキーマ: `docs/data-model.md`(SupabaseのPostgres上にそのまま適用)
- 通知方針: `docs/owner-flow.md`
