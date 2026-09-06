# CLAUDE.md

忘れ物管理アプリ(QR付きシールで持ち物と持ち主を紐付け、拾得者が匿名で届け出て持ち主が報酬を払う)の実装ガイド。詳細仕様は `docs/` 配下を参照。まず `docs/overview.md` を読むこと。

## ディレクトリ構成

```
.
├── CLAUDE.md
└── docs/
    ├── git-flow.md        # Git運用ルール(既存)
    ├── overview.md        # 概要・登場人物・全体フロー
    ├── finder-flow.md     # 拾得者フロー(ログイン不要)
    ├── owner-flow.md      # 持ち主フロー(ログイン必要)
    ├── data-model.md      # DBスキーマ
    ├── token-security.md  # QRトークン設計・セキュリティ
    ├── api.md             # APIエンドポイント一覧
    ├── anonymous-mail.md  # 匿名お届け先(局留め)の実装
    ├── legal-risks.md     # 法的リスクの調査(遺失物法・資金決済法 ほか)
    ├── payout-options.md  # 送金スキームの選択肢(当事者間直接 / ギフトAPI ほか)
    ├── open-issues.md     # 未解決の論点
    └── tech-stack.md      # 技術選定(Next.js, Supabase等)
```

## 実装ルール

- 1ステップ実装したら必ず止まって動作確認を求めること
- UIは機能より先にレイアウト・見た目だけ作って確認を取ること
- 自己判断で複数ステップを一気に進めないこと
- 不明点があれば実装前に必ず確認すること
- 作業は必ずfeatureブランチで行うこと
- ブランチ名はfeature/step{番号}-{内容}の形式にすること
- .envの内容をチャット上に出力しないこと(APIキー漏洩防止)
- Git運用はdocs/git-flow.mdに従うこと
- 各ステップ完了後は必ずPRを作成して止まること(マージは人間が行う)
- PRに動作確認の項目も追加する

## 実装ステップ

- STEP1: DBスキーマ作成(tags/tag_owners/owner_pickup_points/return_cases/rewards)
- STEP2: QRトークン発行・アクティベーションAPI
- STEP3: QRスキャン画面のレイアウト(未登録/登録済み振り分け)
- STEP4: 拾得者フォーム画面のレイアウト(届け方選択・写真・場所)
- STEP5: 拾得者フォームの機能実装(送信API連携)
- STEP6: 匿名お届け先(局留め)発行ロジックと表示画面
- STEP7: 持ち主向け受取拠点登録画面
- STEP8: 持ち主向け通知一覧・詳細画面のレイアウト
- STEP9: 持ち主向け通知機能実装(受信・表示)
- STEP10: 受け取り確認・報酬送金フロー
- STEP11: 未ログイン拾得者の後からの紐付け機能
- STEP12: 局留め期限アラートのバッチ処理