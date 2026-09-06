STEP3: QRスキャン画面のレイアウト (サンプル)

追加ファイル:
- src/app/a/[token]/page.tsx

概要:
- `/a/:token` にアクセスしたときに API (`GET /a/:token`) へ問い合わせ、
  - 未登録 (`unactivated`) → 未登録向けの案内を表示
  - 登録済み (`active`) → 持ち物情報を表示して拾得者フォームへの導線を表示

動作確認手順:
1. 開発サーバーを起動（Next.js 環境のセットアップが必要）
2. ブラウザで `/a/<token>` にアクセスして表示を確認
3. ページ下部の「届け出フォーム (簡易プレビュー)」で入力して「送信 (モック)」ボタンを押すと、モック API が呼ばれます。

モック例:
```bash
curl http://localhost:3000/a/demo-token-123
# ブラウザ上で送信ボタンを押すか以下を実行
curl -X POST http://localhost:3000/api/return-cases -H "Content-Type: application/json" -d '{"token":"demo-token-123","method":"dropoff","found_location":"駅構内","finder_memo":"青い水筒"}'
```

注意:
- ボタンはプレースホルダです。実装時はルーティングやフォームへの遷移を接続してください。
