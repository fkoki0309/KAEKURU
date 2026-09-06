"use client"
import React, { useState, useEffect } from 'react'
import Screen from '../../../_components/Screen'

export default function OwnerPickupPointsPage({ params }: { params: { ownerId: string } }) {
  const ownerId = params.ownerId
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ carrier: '', facility_name: '', facility_address: '', recipient_name: '' })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errors, setErrors] = useState<{ [k: string]: string }>({})

  useEffect(() => {
    fetch(`/api/owners/${ownerId}/pickup-points`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setList(j.pickup_points || [])
      })
  }, [ownerId])

  function validate() {
    const e: { [k: string]: string } = {}
    if (!form.facility_name || form.facility_name.trim().length < 2) e.facility_name = '拠点名は2文字以上で入力してください'
    if (!form.facility_address || form.facility_address.trim().length < 5) e.facility_address = '住所は5文字以上で入力してください'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('saving')
    try {
      const res = await fetch(`/api/owners/${ownerId}/pickup-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const j = await res.json()
      if (j.ok) {
        setList((s) => [j.pickup_point, ...s])
        setForm({ carrier: '', facility_name: '', facility_address: '', recipient_name: '' })
        setStatus('saved')
        setErrors({})
      } else {
        setStatus('error')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <Screen title="受取拠点の登録">
      <form onSubmit={handleSubmit} className="stack-sm">
        <div className="field">
          <label>キャリア</label>
          <input
            value={form.carrier}
            onChange={(e) => setForm({ ...form, carrier: e.target.value })}
            placeholder="例: japan_post"
          />
        </div>
        <div className="field">
          <label>拠点名 <span className="req">*</span></label>
          <input
            value={form.facility_name}
            onChange={(e) => setForm({ ...form, facility_name: e.target.value })}
            placeholder="例: 渋谷郵便局"
          />
          {errors.facility_name && <div className="error-text">{errors.facility_name}</div>}
        </div>
        <div className="field">
          <label>住所 <span className="req">*</span></label>
          <input
            value={form.facility_address}
            onChange={(e) => setForm({ ...form, facility_address: e.target.value })}
            placeholder="住所を入力してください"
          />
          {errors.facility_address && <div className="error-text">{errors.facility_address}</div>}
        </div>
        <div className="field">
          <label>受取人名</label>
          <input
            value={form.recipient_name}
            onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
            placeholder="例: 山田 太郎"
          />
        </div>
        <div className="row">
          <button type="submit" className="button primary" disabled={status === 'saving'}>
            {status === 'saving' ? '保存中…' : '保存'}
          </button>
          <span className="small-muted">
            {status === 'saved' ? '保存しました' : status === 'error' ? 'エラーが発生しました' : ''}
          </span>
        </div>
      </form>

      <div className="stack-sm">
        <h2 className="section-title">登録済み拠点</h2>
        {list.length === 0 ? (
          <p className="small-muted">登録された拠点はありません</p>
        ) : (
          <ul className="list">
            {list.map((p) => (
              <li key={p.id}>
                <div><strong>{p.facility_name}</strong> <span className="small-muted">{p.carrier}</span></div>
                <div className="small-muted">{p.facility_address}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  )
}
