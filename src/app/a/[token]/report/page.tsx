"use client"
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import TagStatusCard from '../../../_components/TagStatusCard'

type Method = 'choose' | 'dropoff' | 'mail'
type TagState = { status: 'loading' | 'active' | 'unactivated' | 'error'; item_name?: string; message?: string }

export default function ReportPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const search = useSearchParams()
  const methodParam = search?.get('method') as 'dropoff' | 'mail' | null
  const shipmentIdParam = search?.get('shipment_id') ?? null

  const [state, setState] = useState<TagState>({ status: 'loading' })
  const [ownerId, setOwnerId] = useState<string | null>(null)

  const [method, setMethod] = useState<Method>(methodParam ?? 'choose')
  const [foundLocation, setFoundLocation] = useState('')
  const [memo, setMemo] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const [ownerPickupPoints, setOwnerPickupPoints] = useState<any[] | null>(null)
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<any | null>(null)
  const [issuedShipmentId, setIssuedShipmentId] = useState<string | null>(shipmentIdParam)

  const [fileUploading, setFileUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(
    shipmentIdParam ? `送り状発行済み: ${shipmentIdParam}` : null,
  )
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
        const body = await res.json()
        if (body.status === 'unactivated') setState({ status: 'unactivated' })
        else if (body.status === 'active') {
          setState({ status: 'active', item_name: body.item_name })
          setOwnerId(body.owner_id ?? null)
        } else setState({ status: 'error', message: '不明なステータス' })
      })
      .catch(() => setState({ status: 'error', message: 'ネットワークエラー' }))
  }, [token])

  // Load the owner's registered pickup points once the mail method is chosen.
  useEffect(() => {
    if (method !== 'mail') return
    if (!ownerId) {
      setOwnerPickupPoints([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/owners/${ownerId}/pickup-points`)
        const j = await res.json()
        if (cancelled) return
        const points = res.ok ? j.pickup_points || [] : []
        setOwnerPickupPoints(points)
        if (points[0]) selectPickupPoint(points[0])
      } catch {
        if (!cancelled) setOwnerPickupPoints([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [method, ownerId])

  function selectPickupPoint(p: any | null) {
    setSelectedPickupPoint(p)
  }

  async function issueShipment() {
    try {
      const res = await fetch('/api/shipments/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const j = await res.json()
      if (!res.ok) {
        setResultMessage(j.error || '送り状発行に失敗しました')
        return
      }
      setIssuedShipmentId(j.shipment_id)
      setResultMessage(`送り状発行済み: ${j.shipment_id}`)
      if (j.pickup_point_id && ownerPickupPoints) {
        const p = ownerPickupPoints.find((x: any) => x.id === j.pickup_point_id)
        if (p) selectPickupPoint(p)
      }
    } catch (err) {
      console.error(err)
      setResultMessage('送り状発行中にエラーが発生しました')
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileUploading(true)
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('file read error'))
        reader.readAsDataURL(f)
      })
      const up = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataUrl }),
      })
      const upBody = await up.json()
      if (!up.ok) setResultMessage(`画像アップロード失敗: ${upBody.error || up.status}`)
      else {
        setPhotoUrl(upBody.url)
        setResultMessage('画像アップロード完了')
      }
    } catch (err) {
      console.error(err)
      setResultMessage('画像アップロード中にエラーが発生しました')
    } finally {
      setFileUploading(false)
    }
  }

  async function submit() {
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
        payload.mail = {
          name: selectedPickupPoint?.recipient_name ?? '',
          address: selectedPickupPoint?.facility_address ?? '',
          phone: selectedPickupPoint?.phone ?? '',
          pickup_point_id: selectedPickupPoint?.id ?? null,
        }
      }
      const res = await fetch('/api/return-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
  }

  if (!token) return <div className="container card">トークンが指定されていません</div>

  return (
    <div className="container card stack">
      <div className="row">
        <a href={`/a/${token}`} className="button ghost">← 戻る</a>
        <h1 className="page-title" style={{ margin: 0 }}>届け出</h1>
      </div>

      {state.status === 'loading' && <p className="muted">読み込み中…</p>}
      {state.status === 'unactivated' && <TagStatusCard status="unactivated" />}
      {state.status === 'error' && (
        <div className="panel stack-sm">
          <strong>エラー</strong>
          <p className="small-muted" style={{ margin: 0 }}>{state.message ?? 'エラーが発生しました'}</p>
        </div>
      )}

      {state.status === 'active' && (
        <>
          <TagStatusCard status="active" itemName={state.item_name} />

          <section className="panel panel--dashed stack">
            {method === 'choose' && (
              <>
                <h2 className="section-title">届け方を選んでください</h2>
                <div className="row">
                  <button className="button lg" onClick={() => setMethod('dropoff')}>どこかに届ける</button>
                  <button className="button lg" onClick={() => setMethod('mail')}>郵送する</button>
                </div>
              </>
            )}

            {method === 'dropoff' && (
              <>
                <div className="row-between">
                  <h2 className="section-title" style={{ margin: 0 }}>どこかに届ける</h2>
                  <button className="button ghost" onClick={() => setMethod('choose')}>方法を変更</button>
                </div>
                <div className="field">
                  <label>届けた場所 <span className="req">*</span></label>
                  <input
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    placeholder="例: 渋谷駅前交番"
                  />
                </div>
                <div className="field">
                  <label>メモ（任意）</label>
                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="発見時の状況など" />
                </div>
              </>
            )}

            {method === 'mail' && (
              <>
                <div className="row-between">
                  <h2 className="section-title" style={{ margin: 0 }}>郵送する</h2>
                  <button className="button ghost" onClick={() => setMethod('choose')}>方法を変更</button>
                </div>

                <div>
                  <button className="button primary" onClick={issueShipment}>送り状を発行する</button>
                  {issuedShipmentId && <span className="small-muted" style={{ marginLeft: 10 }}>発行済み</span>}
                </div>

                <div className="field">
                  <label>送り先（持ち主の登録済み届け先）</label>
                  {ownerPickupPoints === null && <div className="small-muted">読み込み中…</div>}
                  {ownerPickupPoints?.length === 0 && (
                    <div className="small-muted">登録済みの届け先がありません。持ち主に登録を依頼してください。</div>
                  )}
                  {ownerPickupPoints && ownerPickupPoints.length > 0 && (
                    <select
                      value={selectedPickupPoint?.id ?? ''}
                      onChange={(e) => {
                        const p = ownerPickupPoints.find((x: any) => x.id === e.target.value) || null
                        selectPickupPoint(p)
                      }}
                    >
                      {ownerPickupPoints.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.facility_name || p.facility_address || p.recipient_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="field">
                  <label>受取人</label>
                  <input value={selectedPickupPoint?.recipient_name ?? ''} readOnly placeholder="—" />
                </div>
                <div className="field">
                  <label>郵送先住所</label>
                  <input value={selectedPickupPoint?.facility_address ?? ''} readOnly placeholder="—" />
                </div>
                <div className="field">
                  <label>電話番号</label>
                  <input value={selectedPickupPoint?.phone ?? ''} readOnly placeholder="—" />
                </div>
              </>
            )}

            {method !== 'choose' && (
              <>
                <div className="field">
                  <label>写真（任意）</label>
                  <input id={fileInputId} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
                  <div className="row">
                    <button className="button" onClick={() => document.getElementById(fileInputId)?.click()}>
                      {fileUploading ? 'アップロード中…' : photoUrl ? '写真を差し替える' : '写真を撮る / 添付'}
                    </button>
                    {photoUrl && (
                      <a href={photoUrl} target="_blank" rel="noreferrer" className="small">
                        添付画像を表示
                      </a>
                    )}
                  </div>
                </div>

                <div className="row">
                  <button className="button primary" disabled={sending} onClick={submit}>
                    {sending ? '送信中…' : '送信する'}
                  </button>
                </div>
              </>
            )}

            {resultMessage && <p className="result">{resultMessage}</p>}
          </section>
        </>
      )}
    </div>
  )
}
