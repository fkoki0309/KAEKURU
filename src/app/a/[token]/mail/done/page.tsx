"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function MailDonePage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const [loading, setLoading] = useState(true)
  const [mailInfo, setMailInfo] = useState<{ name?: string; address?: string; phone?: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`/api/a/${token}`).then(async (res) => {
      if (!res.ok) return setResult('タグ情報の取得に失敗しました')
      const body = await res.json()
      const ownerId = body.owner_id
      if (!ownerId) return setResult('持ち主情報がありません')
      try {
        const r = await fetch(`/api/owners/${ownerId}/pickup-points`)
        const jb = await r.json()
        const first = (jb.pickup_points || [])[0] ?? null
        if (first) setMailInfo({ name: first.recipient_name || '', address: first.facility_address || '', phone: first.phone || '' })
        else setResult('持ち主の届出先が登録されていません')
      } catch (e) {
        console.error(e)
        setResult('届出先の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }).catch(() => { setResult('ネットワークエラー'); setLoading(false) })
  }, [token])

  if (!token) return <div>トークンが指定されていません</div>

  return (
    <div className="container card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => { try { if (window.history.length > 1) window.history.back(); else window.location.href = `/a/${token}` } catch (e) { window.location.href = `/a/${token}` } }} className="button">戻る</button>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 600 }}>郵送完了フォーム</h1>
      </div>

      {loading && <p>読み込み中…</p>}
      {result && <p>{result}</p>}

      {mailInfo && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <label style={{ fontWeight: 600 }}>宛名</label>
          <input value={mailInfo.name} readOnly style={{ width: '100%', padding: 8, marginBottom: 8, background: '#fbfbfb' }} />
          <label style={{ fontWeight: 600 }}>住所</label>
          <input value={mailInfo.address} readOnly style={{ width: '100%', padding: 8, marginBottom: 8, background: '#fbfbfb' }} />
          <label style={{ fontWeight: 600 }}>電話</label>
          <input value={mailInfo.phone} readOnly style={{ width: '100%', padding: 8, marginBottom: 8, background: '#fbfbfb' }} />

          <div style={{ marginTop: 12 }}>
            <button className="button primary" disabled={sending} onClick={async () => {
              setSending(true)
              setResult(null)
              try {
                const payload: any = { token, method: 'mail', mail: { name: mailInfo.name, address: mailInfo.address, phone: mailInfo.phone } }
                const res = await fetch('/api/return-cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                const jb = await res.json()
                if (!res.ok) setResult(`送信失敗: ${jb.error || res.status}`)
                else setResult(`送信完了: ${jb.return_case.case_code || jb.return_case.id}`)
              } catch (e) {
                console.error(e)
                setResult('送信中にエラーが発生しました')
              } finally {
                setSending(false)
              }
            }}>{sending ? '送信中…' : '郵送完了を送信 (モック)'}</button>
          </div>
          {result && <p style={{ marginTop: 8 }}>{result}</p>}
        </div>
      )}
    </div>
  )
}
