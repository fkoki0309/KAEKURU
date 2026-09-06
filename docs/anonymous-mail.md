# 匿名お届け先(局留め)の実装

持ち主の自宅住所を拾得者に開示せずに配送するための仕組み。局留め(郵便局・営業所留め)を軸にした2段階配送を採用する。

## 方式の比較

| 方式 | 仕組み | 実装コスト | 現実性 |
|---|---|---|---|
| A. 自社中継拠点 | 自社(委託先)の倉庫が一旦受け取り、持ち主へ転送 | 高(物理拠点が要る) | 小規模だと厳しい |
| B. 郵便局/営業所留め | 郵便局・宅配便の「局留め」を宛先にする | 低(既存インフラ活用) | 現実的 |
| C. ロッカー/コンビニ受取代行API | PUDOステーション等の受取ロッカーサービスに連携 | 中(API連携要) | スケールしやすい |

**初期実装はB(局留め)を採用し、将来的にCへ拡張する。**

## 全体の流れ

```
① 持ち主が受取拠点(郵便局 or 営業所)を事前登録
        ↓
② 拾得者が「郵送する」を選択
        ↓
③ サーバーが受付番号を発行し、宛名情報を生成
        ↓
④ 拾得者がその宛先で発送(コンビニ発送 or 郵便窓口)
        ↓
⑤ 持ち主に通知「◯◯局留めで届きます。受付番号:XXXXXX」
        ↓
⑥ 持ち主が局に出向き、本人確認+受付番号で受け取り
        ↓
⑦ 持ち主が「受け取りました」ボタン→ステータス更新→報酬送金トリガー
```

局留めは受取人の氏名と本人確認書類の一致で受け取れることが多く、**住所の開示は不要**。氏名だけなら開示リスクは低いという整理。

## 持ち主側の事前登録

テーブル定義は `docs/data-model.md` の `owner_pickup_points` を参照。

## 発送ケース発行ロジック

```javascript
async function createMailReturnCase(tagToken) {
  const tag = await db.tags.findOne({ token: tagToken });
  const owner = await db.tag_owners.findActive(tag.id);
  const pickupPoint = await db.owner_pickup_points.findLatest(owner.user_id);

  const caseCode = generateCaseCode(); // 例: "FND-7K2X9M"

  await db.return_cases.insert({
    tag_id: tag.id,
    pickup_point_id: pickupPoint.id,
    case_code: caseCode,
    method: 'mail',
    status: 'submitted',
  });

  return {
    carrier: pickupPoint.carrier,
    address_label: `${pickupPoint.facility_name} 留め`,
    facility_address: pickupPoint.facility_address, // 局の住所(公開情報)
    recipient_name: pickupPoint.recipient_name,
    case_code: caseCode,       // 荷物の中に同梱してもらう受付番号
  };
}

function generateCaseCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい文字除去
  return 'FND-' + Array.from({length: 6}, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}
```

## 拾得者への宛名表示(フォーム内)

```
以下の宛先で発送してください:

  渋谷郵便局 留め
  東京都渋谷区◯◯1-2-3
  受取人:田中 様

  荷物の中に、この受付番号を書いたメモを同梱してください:
  FND-7K2X9M
```

住所・氏名の表示はテキストで完結し、特別な帳票システムは不要。受付番号は主に持ち主とアプリ側の突合用。

## ステータス管理

- 拾得者が「発送しました」を押した時点で `shipped_at` を記録し、持ち主に通知
- 持ち主が郵便局で受け取ったら「受け取り確認」ボタンで `received_at` を記録 → 報酬送金トリガー
- `expires_at`(局留めの保管期限、目安10日)を過ぎたら自動的に `expired` にしてアラート

## 将来の拡張:C. ロッカー/コンビニ受取API連携

氏名すら開示したくない、あるいはスケールしたい場合はロッカー事業者のAPIを使い、ワンタイムQR/暗証番号だけを拾得者に渡す方式に切り替えられる。

```
① サーバーがロッカー事業者APIに「受取予約」をリクエスト
② 事業者APIが「発送用バーコード」を返す→拾得者に表示
③ 拾得者はそのバーコードを提示するだけで発送完了(住所入力一切不要)
④ 持ち主にはロッカー解錠用の暗証番号/QRが通知される
```

事業者との契約・API利用料が発生するため、初期フェーズでは過剰投資になりがちで見送り。

## 関連ドキュメント

- 未解決の論点(局留め期限切れ時の荷物の扱い): `docs/open-issues.md`
