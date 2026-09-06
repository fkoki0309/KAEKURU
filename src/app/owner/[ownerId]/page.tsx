"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Screen from '../../_components/Screen'

type DashboardItem = {
  tag_id: string
  token: string | null
  item_name: string | null
  item_photo_url: string | null
  tag_status: 'active' | 'suspended' | 'unactivated'
  unread_notifications: number
  latest_case_status: string
}

const CASE_LABEL: Record<string, string> = {
  none: '拾得の届け出はまだありません',
  submitted: '拾得の届け出が届いています',
  shipped: '発送済み — 受け取り待ち',
  received: '受け取り済み',
  expired: '局留めの期限切れ',
}

export default function OwnerDashboardPage() {
  const params = useParams() as { ownerId?: string }
  const ownerId = params?.ownerId ?? ''
  const router = useRouter()

  const [items, setItems] = useState<DashboardItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ownerId) return
    let cancelled = false
    fetch(`/api/owners/${ownerId}/items`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        if (!j.ok) throw new Error(j.error || 'failed')
        const list: DashboardItem[] = j.items ?? []
        // 動線: 持ち物が1つもなければ登録画面へ誘導する
        if (list.length === 0) {
          router.replace(`/owner/${ownerId}/items/new?first=1`)
          return
        }
        setItems(list)
      })
      .catch((e) => !cancelled && setError(String(e)))
    return () => {
      cancelled = true
    }
  }, [ownerId, router])

  if (error) return <Screen title="マイページ"><p className="error-text">{error}</p></Screen>
  if (items === null) return <Screen title="マイページ"><p className="muted">読み込み中…</p></Screen>

  return (
    <Screen
      title="マイページ"
      action={
        <Link href={`/owner/${ownerId}/items/new`} className="button primary">＋ 持ち物を登録</Link>
      }
    >
      <div className="stack-sm">
        <h2 className="section-title">登録した持ち物</h2>
        {items.map((it) => (
          <div key={it.tag_id} className="panel stack-sm">
            <div className="row-between">
              <div className="row">
                <strong>{it.item_name || '（名称未設定）'}</strong>
                <span className={`pill ${it.tag_status === 'active' ? 'pill--active' : 'pill--inactive'}`}>
                  {it.tag_status === 'active' ? '有効' : '停止中'}
                </span>
              </div>
              {it.unread_notifications > 0 && (
                <span className="pill pill--pending">未読 {it.unread_notifications}</span>
              )}
            </div>
            <div className="small-muted">{CASE_LABEL[it.latest_case_status] ?? it.latest_case_status}</div>
            <div className="row">
              <Link href={`/owner/${ownerId}/notifications?tag=${it.tag_id}`} className="button">この持ち物の通知</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="stack-sm">
        <h2 className="section-title">アカウント</h2>
        <div className="row">
          <Link href={`/owner/${ownerId}/pickup-points`} className="button">受取拠点</Link>
          <Link href={`/owner/${ownerId}/rewards`} className="button">お礼</Link>
        </div>
      </div>
    </Screen>
  )
}
