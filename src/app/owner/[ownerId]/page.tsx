"use client"
import React from 'react'
import { useParams, useSearchParams } from 'next/navigation'

// NOTE: レイアウト確認用のスタブ。実データ接続は後続ステップで
// GET /api/owners/:id/items（tag_owners を持ち物単位で返す）に差し替える。
type DashboardItem = {
  tag_id: string
  item_name: string
  item_photo_url: string | null
  tag_status: 'active' | 'suspended'
  unread_notifications: number
  latest_case_status: 'none' | 'submitted' | 'shipped' | 'received'
}

const SAMPLE_ITEMS: DashboardItem[] = [
  {
    tag_id: 'mock-aaaa1111',
    item_name: '黒い長財布',
    item_photo_url: null,
    tag_status: 'active',
    unread_notifications: 1,
    latest_case_status: 'submitted',
  },
  {
    tag_id: 'mock-bbbb2222',
    item_name: '通勤リュック',
    item_photo_url: null,
    tag_status: 'active',
    unread_notifications: 0,
    latest_case_status: 'none',
  },
]

const CASE_LABEL: Record<DashboardItem['latest_case_status'], string> = {
  none: '拾得の届け出はまだありません',
  submitted: '拾得の届け出が届いています',
  shipped: '発送済み — 受け取り待ち',
  received: '受け取り済み',
}

export default function OwnerDashboardPage() {
  const params = useParams() as { ownerId?: string }
  const ownerId = params?.ownerId ?? ''
  const search = useSearchParams()
  // ?state=empty で空状態をプレビューできる（確認用）
  const items = search?.get('state') === 'empty' ? [] : SAMPLE_ITEMS

  return (
    <div className="container card stack">
      <div className="row-between">
        <h1 className="page-title" style={{ margin: 0 }}>マイページ</h1>
        <a href={`/owner/${ownerId}/items/new`} className="button primary">＋ 持ち物を登録</a>
      </div>

      <div className="stack-sm">
        <h2 className="section-title">登録した持ち物</h2>

        {items.length === 0 && (
          <div className="panel stack-sm" style={{ alignItems: 'flex-start' }}>
            <p className="small-muted" style={{ margin: 0 }}>
              まだ持ち物を登録していません。シールのQRを読み取って最初の持ち物を登録しましょう。
            </p>
            <a href={`/owner/${ownerId}/items/new`} className="button">持ち物を登録する</a>
          </div>
        )}

        {items.map((it) => (
          <div key={it.tag_id} className="panel stack-sm">
            <div className="row-between">
              <div className="row">
                <strong>{it.item_name}</strong>
                <span className={`pill ${it.tag_status === 'active' ? 'pill--active' : 'pill--inactive'}`}>
                  {it.tag_status === 'active' ? '有効' : '停止中'}
                </span>
              </div>
              {it.unread_notifications > 0 && (
                <span className="pill pill--pending">未読 {it.unread_notifications}</span>
              )}
            </div>

            <div className="small-muted">{CASE_LABEL[it.latest_case_status]}</div>

            <div className="row">
              <a href={`/owner/${ownerId}/notifications?tag=${it.tag_id}`} className="button">この持ち物の通知</a>
            </div>
          </div>
        ))}
      </div>

      <div className="stack-sm">
        <h2 className="section-title">アカウント</h2>
        <div className="row">
          <a href={`/owner/${ownerId}/pickup-points`} className="button">受取拠点</a>
          <a href={`/owner/${ownerId}/rewards`} className="button">報酬</a>
        </div>
      </div>
    </div>
  )
}
