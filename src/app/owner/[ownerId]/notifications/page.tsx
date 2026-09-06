"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Screen from '../../../_components/Screen'

export default function OwnerNotificationsPage() {
  const params = useParams() as { ownerId?: string }
  const ownerId = params?.ownerId
  const [notes, setNotes] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!ownerId) return
    setLoading(true)
    fetch(`/api/owners/${ownerId}/notifications`)
      .then((r) => r.json())
      .then((b) => {
        if (!b.ok) throw new Error(b.error || 'failed')
        setNotes(b.notifications ?? [])
      })
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false))
  }, [ownerId])

  if (!ownerId) return <Screen title="通知">ownerId が指定されていません</Screen>

  return (
    <Screen title="通知">
      {loading && <p className="muted">読み込み中…</p>}
      {err && <p className="error-text">{err}</p>}
      {!loading && notes && notes.length === 0 && <p className="small-muted">通知はありません</p>}

      {notes && notes.length > 0 && (
        <ul className="list">
          {notes.map((n) => (
            <li key={n.id} className="stack-sm">
              <div>
                <strong>
                  {n.type === 'found'
                    ? `「${n.item_name ?? '持ち物'}」の落とし物が届け出られました`
                    : n.message}
                </strong>
              </div>

              {n.type === 'found' && (
                <>
                  <div className="small-muted">
                    届け方:{' '}
                    {n.method === 'mail'
                      ? `郵送${n.pickup_point_name ? `（${n.pickup_point_name} 留め）` : ''}`
                      : `手渡し${n.dropoff_location ? `（${n.dropoff_location}）` : ''}`}
                  </div>
                  {n.finder_memo && <div className="small-muted">メモ: {n.finder_memo}</div>}
                  {n.finder_photo_url && (
                    <div className="small-muted">
                      写真: <a href={n.finder_photo_url} target="_blank" rel="noreferrer">開く</a>
                    </div>
                  )}
                </>
              )}

              <div className="small-muted">
                受付番号: {n.case_code ?? n.return_case_id} —{' '}
                {new Date(n.created_at).toLocaleString('ja-JP')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
