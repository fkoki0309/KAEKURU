"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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

  if (!ownerId) return <div className="container card">ownerId が指定されていません</div>

  return (
    <div className="container card stack">
      <h1 className="page-title">通知</h1>

      {loading && <p className="muted">読み込み中…</p>}
      {err && <p className="error-text">{err}</p>}
      {!loading && notes && notes.length === 0 && <p className="small-muted">通知はありません</p>}

      {notes && notes.length > 0 && (
        <ul className="list">
          {notes.map((n) => (
            <li key={n.id}>
              <div><strong>{n.message}</strong></div>
              <div className="small-muted">
                ケース: {n.return_case_id} — {new Date(n.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
