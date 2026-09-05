# STEP9: 持ち主向け通知

目的: 拾得者が返却申請を作成した際、持ち主へ通知を保存して持ち主が確認できるようにする。

実装（モック）

- `mockDb` に通知ストレージを追加。
- `createReturnCase` 実行時に、タグに紐づく `owner` が存在すれば通知を自動生成。
- `GET /api/owners/[ownerId]/notifications` を追加し、持ち主が未読通知を一覧取得できる。

動作確認

1) 返却申請を作成（STEP5 の手順参照）。
2) 所有者IDを取得（mockDb の `activateTag` 等で owner が作成されます。UI から確認可能な場合はそちらを利用してください）。
3) 通知一覧取得:

```bash
curl -s http://localhost:3000/api/owners/{ownerId}/notifications | jq .
```

期待: `{ ok: true, notifications: [...] }` が返る。

備考

- 本番ではデータベースの通知テーブルを使用し、メール/SMS/プッシュ通知への配信を組み合わせてください。
- 今回の実装はモック中心で、実DBパスは 501 を返します。DB モデルが整い次第 Prisma パスを実装してください。
