"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function MailHistoryPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const [loading, setLoading] = useState(true)
  const [shipments, setShipments] = useState<any[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`/api/shipments?token=${encodeURIComponent(token)}`).then(async (res) => {
      const jb = await res.json()
      if (!res.ok) {
        setErr(jb.error || 'failed')
        setLoading(false)
        return
      }
      setShipments(jb.shipments || [])
      setLoading(false)
    }).catch((e) => { console.error(e); setErr('network'); setLoading(false) })
  }, [token])

  if (!token) return <div>トークンが指定されていません</div>

  return (
    <div className="container card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => { try { if (window.history.length > 1) window.history.back(); else window.location.href = `/a/${token}` } catch (e) { window.location.href = `/a/${token}` } }} className="button">戻る</button>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 600 }}>郵送履歴</h1>
      </div>

      {loading && <p>読み込み中…</p>}
      {err && <p>{err}</p>}
      {shipments && shipments.length === 0 && <p>まだ発行された送り状はありません。</p>}
      {shipments && shipments.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th>発行ID</th><th>ラベルID</th><th>宛先PickUp</th><th>作成日</th></tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{s.id}</td>
                <td style={{ padding: 8 }}>{s.shipment_id}</td>
                <td style={{ padding: 8 }}>{s.pickup_point_id || '-'}</td>
                <td style={{ padding: 8 }}>{new Date(s.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
