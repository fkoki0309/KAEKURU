# 技術選定

> 2026-09 更新: フロントエンドとバックエンドを分離し、**Next.js(フロント) / Go(API) / AWS(インフラ)** を
> 採用する方針に変更した。ポートフォリオとして本番運用相当の構成を見せる狙いの、意図的な選択。
> Go / CDK の実装コードは本人が書く前提。旧方針(Next.js1本 + Supabase)は本ドキュメント末尾に
> 記録として残す。インフラの詳細設計は `docs/aws-architecture.md` を参照。

## 選定内容(現行方針)

| レイヤー | 選定 | 理由 |
|---|---|---|
| フロントエンド | Next.js(App Router, TypeScript) | 表示専業。APIルート(`src/app/api/**`)は撤去し、Goへ委譲する |
| バックエンド(API) | **Go** | ビジネスロジック・DBアクセスを担う独立サービス。標準`net/http`(Go1.22+) or 軽量ルーター`chi` |
| DBアクセス(Go) | **sqlc + pgx** | SQLを直接書いて型安全なGoコードを生成。`docs/data-model.md`のDDLをほぼそのまま流用できる |
| マイグレーション | golang-migrate または goose | 標準的なツール |
| DB | **Amazon RDS for PostgreSQL** | 既存のDB設計(UUID, TIMESTAMPTZ, トランザクション+行ロック)がPostgres前提のまま乗る |
| 認証 | 自前(bcrypt + セッションテーブル、Go側で発行・検証) | `docs/token-security.md`の設計をGoに移植。httpOnly Cookie + サーバー検証の方針は維持 |
| 画像ストレージ | **Amazon S3** | 発見時写真の保存。コンテナはローカルファイル永続化ができないため必須 |
| メール送信 | **Amazon SES** | AWSネイティブで安価。通知はメール主軸(`docs/owner-flow.md`) |
| 報酬送金 | 当事者間直接(運営は関与しない) | `docs/legal-risks.md` B、`docs/payout-options.md`。AWS選定とは独立の論点 |
| QRコード生成 | `qrcode`(npmパッケージ、Next.js側) | 外部APIを使わず自前生成可能 |
| バリデーション | Go: `go-playground/validator` / Next: Zod | API境界ごとに型チェック |
| Secrets | AWS Secrets Manager | `.env`直書きをやめて起動時に注入 |
| IaC | **AWS CDK(TypeScript)** | 使い慣れたTypeScriptでインフラをコード化 |
| ホスティング(Next.js / Go) | AWS App Runner | コンテナを渡すだけでスケーリング・HTTPS対応。詳細は`docs/aws-architecture.md` |
| バッチ処理 | EventBridge Scheduler → Go実行 | 局留め期限アラート(STEP12)に使用 |
| CI/CD | GitHub Actions → ECRへpush → App Runnerへデプロイ | PRでtypecheck/lint/test、mainマージでデプロイ |
| 観測性 | CloudWatch Logs/Metrics | まず標準で入るものから |

## 構成イメージ

```
ブラウザ
  │
  ▼
CloudFront(1ディストリビューション、パスでオリジン振り分け)
  ├─ /              → Next.js on App Runner  … SSR/ページ
  └─ /api/*         → Go API on App Runner    … ビジネスロジック
                           │
                           ├─ RDS for PostgreSQL(プライベートサブネット)
                           ├─ S3(発見時写真・アップロード)
                           ├─ SES(メール通知)
                           └─ Secrets Manager(DB接続情報・APIキー)

EventBridge Scheduler → Go製バッチ → 局留め期限アラート(STEP12)
```

ブラウザからは常に1つのドメインにしか見えないので、セッションCookieがクロスオリジンにならず、
`docs/api.md`のエンドポイントパス(`/api/return-cases`等)もそのまま使える。詳細は
`docs/aws-architecture.md` を参照。

## 移行のしやすさ

- `src/lib/mockDb.ts` の関数群(`createReturnCase`, `markReturnCaseReceived`, `linkFinderToReturnCase`等)は、
  ほぼそのまま Go の service 層の仕様書になる
- `docs/data-model.md` のSQL DDLは、そのまま Go のマイグレーションファイルに転用できる
- `docs/api.md` のエンドポイント一覧は、そのまま Go ハンドラの一覧・OpenAPI spec の元ネタになる
- Next.js側の画面コンポーネントは `fetch('/api/...')` のまま変更不要(裏側がGoに変わるだけ)

## 選定のポイント・トレードオフ

- Vercel + モックDBに比べて運用コストは上がる(VPC・RDS・2つのApp Runnerサービスの管理が要る)
- それでも採用する理由: 本番運用・ポートフォリオとしても見せられる構成にしたいという意図的な選択
- 詳細なAWS構成(VPC設計、CDKスタック分割、コスト試算、進め方)は `docs/aws-architecture.md` にまとめる

## 関連ドキュメント

- AWSインフラ設計: `docs/aws-architecture.md`
- DBスキーマ: `docs/data-model.md`(RDS PostgreSQL上にそのまま適用)
- 通知方針: `docs/owner-flow.md`
- 送金スキーム: `docs/payout-options.md`

---

## 旧方針(記録): Next.js1本 + Supabase

2026-09 の方針変更前に検討していた構成。DB・認証・画像ストレージをSupabaseに集約し、
Next.js 1本(APIルート込み)で完結させる案。外部サービス数を減らして初期構築・運用負荷を
下げる狙いだったが、AWSでの本番運用・ポートフォリオ価値を優先し不採用とした。

| レイヤー | 選定 | 理由 |
|---|---|---|
| フロントエンド/バックエンド | Next.js(TypeScript) | フォーム中心のUIとAPIを1リポジトリで完結できる |
| DB | Supabase(PostgreSQL) | マネージドPostgres |
| ORM | Prisma | スキーマ管理・マイグレーションがコード化できる |
| 認証 | Supabase Auth | DBと同じSupabaseプロジェクト内で完結 |
| ホスティング | Vercel(アプリ)+ Supabase(DB/Auth) | サーバー管理不要で立ち上げが速い |
| 画像ストレージ | Supabase Storage | DB/認証と同じ基盤にまとめて運用をシンプルに |
