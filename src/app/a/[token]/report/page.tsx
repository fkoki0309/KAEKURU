"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

export default function ReportPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const search = useSearchParams()
  const methodParam = search?.get('method') as 'dropoff' | 'mail' | null
  const shipmentIdParam = search?.get('shipment_id') ?? null

  const [state, setState] = useState<{ status: 'loading' | 'active' | 'unactivated' | 'error'; item_name?: string; message?: string }>({ status: 'loading' })

  const [foundLocation, setFoundLocation] = useState('')
  const [memo, setMemo] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [method, setMethod] = useState<'dropoff' | 'mail' | 'choose'>(methodParam ?? 'choose')
  const [mailName, setMailName] = useState('')
  const [mailAddress, setMailAddress] = useState('')
  const [mailPhone, setMailPhone] = useState('')
  const [ownerPickupPoints, setOwnerPickupPoints] = useState<any[] | null>(null)
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<any | null>(null)
  const [issuedShipmentId, setIssuedShipmentId] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const fileInputId = 'finder-photo-input'

  useEffect(() => {
    if (!token) return
    setState({ status: 'loading' })
    fetch(`/api/a/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (res.status === 404) return setState({ status: 'error', message: 'タグが見つかりません' })
          return setState({ status: 'error', message: body.error || '不明なエラー' })
        }
        return res.json().then((body) => {
          if (body.status === 'unactivated') setState({ status: 'unactivated' })
          else if (body.status === 'active') {
            setState({ status: 'active', item_name: body.item_name })
            ;(window as any).__kaekuru_owner_id__ = body.owner_id ?? null
          } else setState({ status: 'error', message: '不明なステータス' })
        })
      })
      .catch(() => setState({ status: 'error', message: 'ネットワークエラー' }))
  }, [token])

    useEffect(() => {
      if (shipmentIdParam) {
        setResultMessage(`送り状発行済み: ${shipmentIdParam}`)
      }
    }, [shipmentIdParam])

  // fetch owner pickup points automatically when mail method selected
  useEffect(() => {
    async function loadPickup() {
      const ownerId = (window as any).__kaekuru_owner_id__
      if (!ownerId) return
      try {
        const res = await fetch(`/api/owners/${ownerId}/pickup-points`)
        const j = await res.json()
        if (!res.ok) return setOwnerPickupPoints([])
        setOwnerPickupPoints(j.pickup_points || [])
        const first = (j.pickup_points || [])[0] ?? null
        setSelectedPickupPoint(first)
        if (first) {
          setMailName(first.recipient_name || '')
          setMailAddress(first.facility_address || '')
          setMailPhone(first.phone || '')
        }
      } catch (err) {
        console.error(err)
        setOwnerPickupPoints([])
      }
    }
    if (method === 'mail') loadPickup()
  }, [method, token])

  if (!token) return <div>トークンが指定されていません</div>

  return (
    <div className="container card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => { try { if (window.history.length > 1) window.history.back(); else window.location.href = `/a/${token}` } catch (e) { window.location.href = `/a/${token}` } }} className="button">戻る</button>
        <h1 style={{ fontSize: 22, margin: 0, fontWeight: 600 }}>QRタグ: {token}</h1>
      </div>

      {state.status === 'loading' && <p>読み込み中…</p>}
      {state.status === 'unactivated' && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>このタグは未登録です</h2>
          <p>持ち主の方はログインしてタグを登録してください。</p>
        </div>
      )}

      {state.status === 'active' && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>このタグは登録済みです</h2>
          <p><strong>持ち物:</strong> {state.item_name ?? '—'}</p>
        </div>
      )}

      <section style={{ border: '1px dashed #ddd', padding: 16, borderRadius: 8, marginTop: 16 }}>
        <h3>届け出フォーム</h3>

        {method === 'choose' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setMethod('dropoff')} style={{ padding: '12px 16px' }}>どこかに届ける</button>
            <button onClick={() => setMethod('mail')} style={{ padding: '12px 16px' }}>郵送する</button>
          </div>
        )}

        {method === 'dropoff' && (
          <>
            <label style={{ fontWeight: 600, marginBottom: 6 }}>届けた場所 (必須)</label>
            <input value={foundLocation} onChange={(e) => setFoundLocation(e.target.value)} placeholder="例: 駅の交番" style={{ padding: 10, borderRadius: 8, border: '1px solid #e6e6e6', width: '100%' }} />
          </>
        )}

        {method === 'mail' && (
          <>
            <div style={{ marginBottom: 10 }}>
              <button className="button primary" onClick={async () => {
                try {
                  const res = await fetch('/api/shipments/issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
                  const j = await res.json()
                  if (!res.ok) return alert(j.error || '送り状発行に失敗しました')
                  setIssuedShipmentId(j.shipment_id)
                  setResultMessage(`送り状発行済み: ${j.shipment_id}`)
                  // if API returned pickup_point_id, try to select it
                  if (j.pickup_point_id) {
                    // ensure pickup points are loaded
                    if (!ownerPickupPoints) {
                      const ownerId = (window as any).__kaekuru_owner_id__
                      const r = await fetch(`/api/owners/${ownerId}/pickup-points`)
                      const body = await r.json()
                      setOwnerPickupPoints(body.pickup_points || [])
                    }
                    if (j.pickup_point_id) {
                      if (!ownerPickupPoints) {
                        const ownerId = (window as any).__kaekuru_owner_id__
                        try {
                          const r = await fetch(`/api/owners/${ownerId}/pickup-points`)
                          const body = await r.json()
                          const pts = body.pickup_points || []
                          setOwnerPickupPoints(pts)
                          const p = pts.find((x: any) => x.id === j.pickup_point_id)
                          if (p) {
                            setMailName(p.recipient_name || '')
                            setMailAddress(p.facility_address || '')
                            setMailPhone(p.phone || '')
                            setSelectedPickupPoint(p)
                          }
                        } catch (err) {
                          console.error(err)
                        }
                      } else {
                        const p = ownerPickupPoints.find((x: any) => x.id === j.pickup_point_id)
                        if (p) {
                          setMailName(p.recipient_name || '')
                          setMailAddress(p.facility_address || '')
                          setMailPhone(p.phone || '')
                          setSelectedPickupPoint(p)
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.error(err)
                  alert('送り状発行中にエラー')
                }
              }}>送り状を発行する</button>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>持ち主の登録済み届出先</div>
                {ownerPickupPoints === null && <div className="small-muted">読み込み中…</div>}
                {ownerPickupPoints && ownerPickupPoints.length === 0 && <div className="small-muted">登録済みの届出住所がありません。持ち主に登録してもらってください。</div>}
                {ownerPickupPoints && ownerPickupPoints.length > 0 && (
                  <select value={selectedPickupPoint ? selectedPickupPoint.id : ''} onChange={(e) => {
                    const id = e.target.value
                    const p = (ownerPickupPoints || []).find((x: any) => x.id === id) || null
                    setSelectedPickupPoint(p)
                    if (p) {
                      setMailName(p.recipient_name || '')
                      setMailAddress(p.facility_address || '')
                      setMailPhone(p.phone || '')
                    }
                  }} style={{ padding: 10, borderRadius: 8, border: '1px solid #e6e6e6', width: '100%' }}>
                    {(ownerPickupPoints || []).map((p: any) => <option key={p.id} value={p.id}>{p.facility_name || p.facility_address || p.recipient_name}</option>)}
                  </select>
                )}
              </div>
            </div>

            <label style={{ fontWeight: 600, marginBottom: 6 }}>送り先氏名（局留め先・受取人）</label>
            <input value={mailName} readOnly placeholder="受取人氏名" style={{ padding: 10, borderRadius: 8, border: '1px solid #e6e6e6', width: '100%', background: '#fbfbfb' }} />
            <label style={{ fontWeight: 600, marginBottom: 6 }}>住所（郵送先）</label>
            <input value={mailAddress} readOnly placeholder="住所" style={{ padding: 10, borderRadius: 8, border: '1px solid #e6e6e6', width: '100%', background: '#fbfbfb' }} />
            <label style={{ fontWeight: 600, marginBottom: 6 }}>電話番号（任意）</label>
            <input value={mailPhone} readOnly placeholder="電話番号" style={{ padding: 10, borderRadius: 8, border: '1px solid #e6e6e6', width: '100%', background: '#fbfbfb' }} />
          </>
        )}

        {method !== 'mail' && (
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモ (任意)" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} rows={3} />
        )}

        <div style={{ display: 'flex', gap: 8, flexDirection: 'column', marginTop: 8 }}>
          <input id={fileInputId} type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
            const f = (e.target as HTMLInputElement).files?.[0]
            if (!f) return
            setFileUploading(true)
            try {
              const reader = new FileReader()
              const dataUrl: string = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(String(reader.result))
                reader.onerror = () => reject(new Error('file read error'))
                reader.readAsDataURL(f)
              })
              const up = await fetch('/api/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: dataUrl }) })
              const upBody = await up.json()
              if (!up.ok) {
                setResultMessage(`画像アップロード失敗: ${upBody.error || up.status}`)
              } else {
                setPhotoUrl(upBody.url)
                setResultMessage('画像アップロード完了')
              }
            } catch (err) {
              console.error(err)
              setResultMessage('画像アップロード中にエラーが発生しました')
            } finally {
              setFileUploading(false)
            }
          }} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => document.getElementById(fileInputId)?.click()} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e6e6e6', background: '#fff', cursor: 'pointer' }}>{fileUploading ? 'アップロード中…' : (photoUrl ? '写真を差し替える' : '写真を撮る/添付')}</button>
            <button disabled={sending} onClick={async () => {
              setSending(true)
              setResultMessage(null)
              try {
                const payload: any = { token, method: method === 'mail' ? 'mail' : 'dropoff' }
                if (photoUrl) payload.finder_photo_url = photoUrl
                if (method === 'dropoff') {
                  payload.finder_memo = memo
                  payload.dropoff_location = foundLocation
                }
                if (method === 'mail') {
                  payload.mail = { name: mailName, address: mailAddress, phone: mailPhone, pickup_point_id: selectedPickupPoint?.id ?? null }
                }
                const res = await fetch('/api/return-cases', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                })
                const body = await res.json()
                if (!res.ok) setResultMessage(`送信失敗: ${body.error || res.status}`)
                else setResultMessage(`送信完了: ${body.return_case.case_code || body.return_case.id}`)
              } catch (err) {
                console.error(err)
                setResultMessage('送信中にエラーが発生しました')
              } finally {
                setSending(false)
              }
            }} style={{ padding: '10px 12px', background: '#0f62fe', color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{sending ? '送信中…' : '送信 (モック)'}</button>
          </div>
          {photoUrl && <div><strong>添付画像:</strong> <a href={photoUrl} target="_blank" rel="noreferrer">表示</a></div>}
          {resultMessage && <p>{resultMessage}</p>}
        </div>
      </section>

    </div>
  )
}
