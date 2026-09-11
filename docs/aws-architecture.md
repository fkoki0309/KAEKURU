# AWSインフラ設計

`docs/tech-stack.md` で決めた Next.js(フロント) / Go(API) / AWS(インフラ) 構成の詳細設計。
**Go・CDKの実装コードは本人が書く前提**で、ここでは構成・仕様・進め方を決める。
ポートフォリオとして「なぜその構成にしたか」を説明できることを重視する。

## 1. 全体構成

```
                         ┌─────────────────────────────┐
ブラウザ ──HTTPS──▶      │  CloudFront (1ディストリビューション)│
                         │   /*      → Next.js オリジン   │
                         │   /api/*  → Go API オリジン    │
                         └───────────────┬───────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     │              VPC(1個)                    │
                     │                                          │
     ┌───────────────┴───────────────┐   ┌──────────────────────┴──────┐
     │ Public/App Runner管理サブネット │   │  Private サブネット(2 AZ)     │
     │                                │   │                              │
     │  App Runner: Next.js            │   │  RDS for PostgreSQL(単一AZ)  │
     │  App Runner: Go API ──VPC接続──▶│   │                              │
     └────────────────────────────────┘   └──────────────────────────────┘

Go API ──▶ S3(発見時写真)
Go API ──▶ SES(メール送信)
Go API ──▶ Secrets Manager(DB接続情報)
EventBridge Scheduler ──▶ Go バッチ(局留め期限アラート、STEP12)
GitHub Actions ──OIDC(キーレス)──▶ ECR push ──▶ App Runner デプロイ
```

**ブラウザは常に1オリジン(CloudFront)しか見ない。** これでセッションCookieがクロスオリジンに
ならず、`docs/api.md` のパス(`/api/return-cases` 等)もそのまま使える。ローカル開発では
`next.config.js` の `rewrites()` で同じことを代用する(`/api/:path*` → `http://localhost:8080/:path*`)。

## 2. VPC設計

| 項目 | 内容 | 理由 |
|---|---|---|
| VPC | 1個、CIDR例 `10.0.0.0/16` | 単一プロジェクトなので分割不要 |
| サブネット | Private ×2(異なるAZ、RDS用) | RDSはMulti-AZ構成にしなくても2サブネット指定が要る(サブネットグループの制約) |
| NATゲートウェイ | **作らない** | 月額約$32+データ処理料がかかる。App RunnerはNAT無しでインターネット到達可能(マネージドのVPCコネクタ経由)。Go→SES/S3等のAWS API呼び出しは後述のVPCエンドポイントで賄う |
| VPCエンドポイント | S3(Gateway型、無料)、Secrets Manager(Interface型、少額) | NATを使わずにAWSサービスへプライベート到達。コストを抑えつつ「経路を絞る」という設計判断を示せる |
| セキュリティグループ | RDS用SGは「GoのApp Runner VPCコネクタが使うSGからの5432のみ許可」 | 最小権限。踏み台や広い0.0.0.0/0は使わない |

App Runner はデフォルトではVPCの外(マネージド環境)で動くため、RDSのようなプライベートリソースに
アクセスするには **VPCコネクタ** を使う。ECS Fargate + ALB より設定項目が少なく、ポートフォリオの
「変に複雑にしていない、判断が効いている」という見せ方に向く。将来トラフィックが増えて
きめ細かい制御(Blue/Green、複数コンテナのサイドカー等)が要るタイミングでECS Fargateへの
切り替えを検討すればよい(CDKのスタック分割をサービス単位にしておけば差し替えやすい)。

## 3. CDKスタック分割(TypeScript)

1つの巨大なスタックにせず、責務ごとに分ける(portfolio審査でも読みやすい構成):

| スタック | 責務 | 主なリソース |
|---|---|---|
| `NetworkStack` | VPC・サブネット・SG・VPCエンドポイント | VPC, Subnet, SecurityGroup, GatewayEndpoint, InterfaceEndpoint |
| `DataStack` | DB本体とその接続情報 | RDS Instance, DB SubnetGroup, Secrets Manager Secret(自動ローテーション対応) |
| `StorageStack` | 画像アップロード先 | S3 Bucket(パブリックアクセスブロック、ライフサイクルルール) |
| `BackendStack` | Go API | App Runner Service, VPC Connector, IAM Role(S3/SES/SecretsへのReadアクセスのみ), ECR Repository |
| `FrontendStack` | Next.js | App Runner Service, ECR Repository |
| `EdgeStack` | 配信・ルーティング | CloudFront Distribution(Origin2つ、パスベースの振り分け)、ACM証明書、Route53レコード |

依存関係: `NetworkStack` → `DataStack`/`StorageStack` → `BackendStack` → `FrontendStack`/`EdgeStack`。
CDKの `Stack` 間は `exportValue`/`fromXxxAttributes` でつなぐ。

## 4. 環境戦略

- 最初は **単一環境(例: `prod` 1つ)** でよい。ポートフォリオ用途でstaging環境まで持つのは
  コスト対効果が薄い
- CDKの各StackにContext(`env=prod`)を渡す形にだけしておけば、後から`dev`を足すのは容易
- ブランチ運用は既存の `docs/git-flow.md` のfeatureブランチ運用をそのまま使い、
  mainマージ→CI/CDでデプロイ、という流れにする

## 5. コスト概算(低トラフィックのポートフォリオ運用、東京リージョン想定)

| リソース | 概算月額 | 備考 |
|---|---|---|
| RDS db.t4g.micro(Single-AZ, 20GB) | 約$15〜25 | 最初はこれで十分。t4g.microでも過剰なくらい |
| App Runner(Go API, 0.25vCPU/0.5GB, 低トラフィック) | 約$5〜15 | リクエストが無い時間はスケールダウン |
| App Runner(Next.js, 同上) | 約$5〜15 | 同上 |
| S3 | 数十円〜 | 写真アップロードの量次第、ほぼ誤差 |
| CloudFront | 数十円〜 | 無料利用枠でほぼ収まる規模 |
| SES | 数百通/月なら誤差レベル | $0.10/1000通 |
| Secrets Manager | 約$0.40×シークレット数/月 | DB接続情報1件なら$0.4程度 |
| **合計目安** | **概ね$30〜60/月** | 見積もりはAWS Pricing Calculatorで要確認。使わない時は停止して節約可 |

NATゲートウェイを作らない判断だけで月$32前後の固定費を避けられる点は、設計判断として
説明しやすい材料になる。

## 6. セキュリティ設計の要点

- IAMは **サービスごとに最小権限のロール**(GoのApp RunnerロールはS3の該当バケットへの
  PutObject/GetObjectのみ、SESのsendEmailのみ、Secrets Managerの該当シークレットのGetSecretValueのみ)
- RDSはプライベートサブネットのみ、パブリックアクセス無効
- GitHub ActionsからAWSへは **OIDCフェデレーション**(IAMユーザーの長期キーを発行しない)で認証。
  `docs/git-flow.md`・CLAUDE.mdの「APIキーをチャットに出力しない」方針とも整合する
- Secrets ManagerのDB認証情報はローテーション設定を検討(RDS + Secrets Managerの自動ローテーション機能)

## 7. ローカル開発フロー

- DB: `docker-compose up`でローカルPostgresコンテナ(RDSと同じメジャーバージョン)
- Go API: `go run ./cmd/api`(環境変数はローカルの`.env`、本番はSecrets Manager)
- Next.js: `npm run dev`。`next.config.js`の`rewrites()`で`/api/*`をローカルGo(`:8080`)へプロキシ
- こうすることで「本番はCloudFrontのパスルーティング、ローカルはNext.jsのrewrites」で
  フロントから見たAPIパスが完全に一致する

## 8. 進め方の目安(本人実装、Claudeは相談役)

既存の `docs/` にあるSTEP1〜12はモックDB版Next.jsの実装ステップ。AWS移行は並行する
別トラックとして、以下の順で進めると手戻りが少ない:

1. **基盤**: AWSアカウント整理、CDK Bootstrap、GitHub Actions用OIDC、ドメイン取得/Route53
2. **ネットワーク**: `NetworkStack`(VPC・サブネット・エンドポイント)
3. **データ層**: `DataStack`(RDS・Secrets Manager)→ `docs/data-model.md`のDDLを流し込み、
   golang-migrate/gooseの雛形を作る
4. **Go最小API**: ヘルスチェック1本(`GET /api/health`)だけを`BackendStack`でApp Runnerに乗せ、
   デプロイパイプラインを先に確立する
5. **認証移植**: `docs/token-security.md`のセッション設計をGoで実装(bcrypt、セッションテーブル、
   Cookie発行)
6. **コア機能移植**: `docs/api.md`のエンドポイントを1つずつGoに実装(tags→return-cases→rewards の順)
7. **ストレージ**: `StorageStack`(S3)、アップロードAPIをS3署名付きURL方式に切り替え
8. **フロント接続**: `FrontendStack` + `EdgeStack`(CloudFront)。Next.js側のAPIルートを撤去し、
   全リクエストをGoへ
9. **通知**: SES連携
10. **バッチ**: EventBridge Scheduler + 局留め期限アラート(STEP12)
11. **CI/CD**: GitHub Actions(typecheck/lint/test → ECR push → デプロイ)を`main`マージで自動化
12. **観測性**: CloudWatch Logs/Metricsのダッシュボード、必要ならアラーム

各ステップは独立してデモ・レビューできる単位にしてあるので、CLAUDE.mdの
「1ステップごとに止まって確認」という進め方とも相性がよい。

## 関連ドキュメント

- 技術選定サマリ: `docs/tech-stack.md`
- APIエンドポイント一覧(Goハンドラの元仕様): `docs/api.md`
- DBスキーマ(RDSにそのまま適用): `docs/data-model.md`
- Git運用: `docs/git-flow.md`
