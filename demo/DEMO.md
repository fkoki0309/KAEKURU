# KAEKURU デモ手順

`main`（step17 まで）時点。モックモード（`DATABASE_URL` なし）で動かします。

主役タグ = **`demo-token-123`**。同梱の QR:

| ファイル | 中身 | 用途 |
|---|---|---|
| `qr-demo-token-123-lan.png` | `http://192.168.11.5:3000/a/demo-token-123` | スマホでスキャン |
| `qr-demo-token-123-localhost.png` | `http://localhost:3000/a/demo-token-123` | 同じ Mac の QR リーダー / カメラ |
| `qr-demo-token-activated-*.png` | 2個目の持ち物用（`demo-token-activated`） | 任意 |

> **現状 3 か所だけ端末コマンドが要ります**（UI 未接続）。該当箇所に「▶ ターミナル」と明記しています。
> フルにクリックだけで通したい場合は、その旨リクエストください（登録フォーム接続 + 受け取り確認ボタンを小さく足せます）。

---

## 0. 起動 & リセット

> zsh にコメント(`#`)をそのまま貼ると `pathspec '#' did not match` になることがあります。以下は **コメントなし** です。

既存の dev サーバーが 3000 番を掴んでいたら先に止める:

```bash
lsof -ti tcp:3000 | xargs kill
```

セットアップ:

```bash
cd ~/KAEKURU
git checkout main && git pull
rm -rf tmp .next
DATABASE_URL= npx next dev -H 0.0.0.0 -p 3000
```

`rm -rf tmp` でモック状態を消すと、起動時に `demo-token-123`(未登録)/ `demo-token-activated`(登録済み)がシードし直されます。

- **スマホで試す**: Mac と同じ Wi-Fi に接続 → `-lan` 版 QR。初回は macOS のファイアウォールで node の受信を許可。IP が違う場合は下記「QR を作り直す」参照。
- **Mac だけで試す**: `-localhost` 版 QR、または URL を直打ち。

---

## 1.【拾得者】未登録タグをスキャン

1. `qr-demo-token-123` をスキャン → `/a/demo-token-123` が開く
2. **「未登録」** と表示されて終了。持ち主情報も持ち物名も一切出ない ← 未登録タグの正しい挙動

---

## 2.【持ち主】ログインして持ち物を登録

1. Mac のブラウザで `http://localhost:3000/owner/login`
2. **`test` / `test`** でログイン → マイページに着地
3. 「＋ 持ち物を登録」→ トークン `demo-token-123` / 名前「黒い長財布」→ 「登録する」

   ▶ **ターミナル**（登録フォームは現状デモ表示のみ。実際の有効化はこれ）:
   ```bash
   curl -s -c /tmp/kaekuru.txt -X POST http://localhost:3000/api/auth/login \
     -H 'Content-Type: application/json' -d '{"email":"test","password":"test"}'

   curl -s -b /tmp/kaekuru.txt -X POST http://localhost:3000/api/tags/activate \
     -H 'Content-Type: application/json' \
     -d '{"token":"demo-token-123","item_name":"黒い長財布"}'
   ```

4. **（郵送デモをするなら）受取拠点を登録**: マイページ →「受取拠点」
   - 拠点名「渋谷郵便局」/ 住所「東京都渋谷区渋谷1-1-1」/ 受取人名「カエクル 太郎」→ 「保存」

---

## 3.【拾得者】もう一度スキャン → 届け出

1. `qr-demo-token-123` を再スキャン → 今度は **「登録済み / 持ち物: 黒い長財布」**
2. 「届け出る」→ 届け出画面へ
3. 届け方を選ぶ:

### 3a. どこかに届ける
- 「どこかに届ける」→ 届けた場所「渋谷駅前交番」→（任意）メモ・写真 →「送信する」
- **受付番号 `FND-XXXXX`** が表示される（メモしておく）

### 3b. 郵送する
- 「郵送する」→ **匿名お届け先**が表示される:
  ```
  渋谷郵便局 留め
  東京都渋谷区渋谷1-1-1
  受取人: カエクル 太郎 様
  ```
- 「送信する」→ 受付番号 `FND-XXXXX`
- 持ち主の自宅住所・電話番号は一切表示されない（局留めの公開情報のみ）

---

## 4.【持ち主】通知を確認 → 受け取り

1. `http://localhost:3000/owner/login`（ログイン済みならマイページ）→ ナビの「通知」
2. 「Your item (黒い長財布) was reported found (case FND-XXXXX)」が表示される（実データ）

   > マイページの持ち物カードは現状サンプル表示です。通知一覧は本物です。

3. 受け取り確認

   ▶ **ターミナル**（通知画面に確認ボタンが未実装）。まず `return_case_id` を確認:
   ```bash
   curl -s -b /tmp/kaekuru.txt http://localhost:3000/api/owners/owner-demo/notifications
   ```
   `<rcId>` をその `return_case_id` に置換して受け取り確認:
   ```bash
   curl -s -X POST http://localhost:3000/api/return-cases/<rcId>/confirm
   ```

---

## 5.【報酬】（任意）

▶ **ターミナル**（報酬を作成。`<rcId>` は上の return_case_id）:
```bash
curl -s -X POST http://localhost:3000/api/return-cases/<rcId>/rewards \
  -H 'Content-Type: application/json' -d '{"amount":1000}'
```
- マイページ →「報酬」で ¥1,000 / pending が見える
- 「支払済みにする（モック）」を押す → paid に変わる

---

## 6.【拾得者】後から紐付け（任意）

未ログインで届け出た拾得者が、控えた受付番号で後から報酬受け取り用に紐付け:

- `http://localhost:3000/return-cases/<rcId>/link` を開く
- 名前 / メール / 電話 → 「紐付けする」

---

## やり直し（リセット）

dev サーバーを停止（Ctrl+C）してから:

```bash
rm -rf tmp .next
```

---

## QR を作り直す（IP が違う / 別ポート）

`IP` は自分の LAN IP（`ipconfig getifaddr en0`）。

```bash
IP=$(ipconfig getifaddr en0)
npx qrcode -o qr.png "http://$IP:3000/a/demo-token-123" -w 600
```
