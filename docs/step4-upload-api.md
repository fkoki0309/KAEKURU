# STEP4 サンプル: 画像アップロードAPI (モック)

目的: 拾得者がフォームから写真を添付できるよう、簡易アップロードAPIを提供します。

エンドポイント
- `POST /api/uploads` — Body: `{ data: string }`。
  - `data` は base64 文字列、または data URL (`data:image/png;base64,...`) を受け取ります。
  - レスポンス: `{ ok: true, url: "/uploads/<file>" }`

実装ノート
- ファイルは `public/uploads/` に保存されるため、開発中は直接ブラウザでアクセス可能です。
- 本番では Supabase Storage 等に置き換えてください。

動作確認例

```bash
# data URL を使う例 (ファイルを base64 に変換する手順はローカルツールで行ってください)
curl -X POST http://localhost:3000/api/uploads \
  -H "Content-Type: application/json" \
  -d '{"data":"data:image/png;base64,iVBORw0KGgoAAAANS..."}'

# 成功レスポンス：
#{ "ok": true, "url": "/uploads/169...-abc123.png" }
```
