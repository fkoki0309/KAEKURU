"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function MailConfirmPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const [loading, setLoading] = useState(true)
  const [mailInfo, setMailInfo] = useState<{ name?: string; address?: string; phone?: string } | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`/api/a/${token}`).then(async (res) => {
      if (!res.ok) return setMessage('タグ情報の取得に失敗しました')
      const body = await res.json()
      const ownerId = body.owner_id
      if (!ownerId) return setMessage('持ち主情報がありません')
      try {
        const r = await fetch(`/api/owners/${ownerId}/pickup-points`)
        const jb = await r.json()
        const first = (jb.pickup_points || [])[0] ?? null
        if (first) setMailInfo({ name: first.recipient_name || '', address: first.facility_address || '', phone: first.phone || '' })
        else setMessage('持ち主の届出先が登録されていません')
      } catch (e) {
        console.error(e)
        setMessage('届出先の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }).catch(() => { setMessage('ネットワークエラー'); setLoading(false) })
  }, [token])

  if (!token) return <div>トークンが指定されていません</div>

  return (
    <div className="container card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => { try { if (window.history.length > 1) window.history.back(); else window.location.href = `/a/${token}` } catch (e) { window.location.href = `/a/${token}` } }} className="button">戻る</button>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 600 }}>郵送のご案内</h1>
      </div>

      {loading && <p>読み込み中…</p>}
      {message && <p>{message}</p>}

      {mailInfo && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <p>下記の宛先へ郵送してください（郵便局の局留め等）:</p>
          <p><strong>宛名:</strong> {mailInfo.name}</p>
          <p><strong>住所:</strong> {mailInfo.address}</p>
          <p><strong>電話:</strong> {mailInfo.phone}</p>
          <div style={{ marginTop: 12 }}>
            <button className="button primary" onClick={() => { window.location.href = `/a/${token}/mail/done` }}>郵送しました</button>
          </div>
        </div>
      )}
    </div>
  )
}
