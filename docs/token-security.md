# QRトークン設計・セキュリティ

## トークンの生成

- 連番は禁止。`crypto.randomBytes(16).toString('base64url')` 等、128bit以上の暗号学的乱数を使う
- URL例: `https://app.example.com/t/7Kx9mP2vQnZ8wRtL4bYc6H`
- タグ(持ち物)単位でトークンを発行し、ユーザー単位のURLにはしない(1シール=1持ち物)。理由:
  - 拾得者が何を拾ったかシステム側で区別できる
  - 1点のシールが漏洩・コピーされても他の持ち物は無事
  - 譲渡・紛失モードのON/OFFを持ち物単位で制御できる

## アクティベーション(トークンとユーザーの紐付け)

```javascript
async function activateTag(token, userId, itemData) {
  const tag = await db.tags.findOne({ token });
  if (!tag) throw new NotFoundError();

  return await db.transaction(async (trx) => {
    const locked = await trx.tags.lockForUpdate(tag.id);
    if (locked.status !== 'unactivated') {
      throw new ConflictError('already activated');
    }
    await trx.tags.update(tag.id, { status: 'active' });
    await trx.tag_owners.insert({
      tag_id: tag.id,
      user_id: userId,
      item_name: itemData.item_name,
      activated_at: new Date(),
    });
  });
}
```

- DBトランザクション + 行ロック(`lockForUpdate`)で排他制御し、同一トークンの二重登録を防ぐ
- Amazon経由で購入された場合は、購入者自身が同梱コードでアクティベーションする一度きりのフローにする(コード+ワンタイムPINの二段階を推奨)

## セキュリティ上の注意点

| リスク | 対策 |
|---|---|
| トークン総当たり攻撃 | レート制限(IP単位)、トークン長を十分に確保(22文字以上) |
| 二重アクティベーション競合 | DBトランザクション+行ロック |
| 中古シールの使い回し詐欺 | ロット×トークンの発行記録を残し、異常な複数回activateを検知 |
| QRの画像コピー・偽造 | トークンをQRだけでなく物理的な特殊シール(ホログラム等)と併用 |
| Amazon経由の不正登録 | コード+ワンタイムPINの二段階、コードの有効期限設定 |

## 関連ドキュメント

- タグ・所有関係のテーブル定義: `docs/data-model.md`
- アクティベーションAPI: `docs/api.md`
