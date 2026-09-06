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

  if (!ownerId) return <div>ownerId が指定されていません</div>

  return (
    <div style={{ maxWidth: 720, margin: '32px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>通知 — 持ち主: {ownerId}</h1>
      {loading && <p>読み込み中…</p>}
      {err && <p style={{ color: 'red' }}>{err}</p>}
      {!loading && notes && notes.length === 0 && <p>通知はありません</p>}
      <ul>
        {notes && notes.map((n) => (
          <li key={n.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
            <div><strong>{n.message}</strong></div>
            <div style={{ fontSize: 12, color: '#666' }}>case: {n.return_case_id} — {new Date(n.created_at).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
