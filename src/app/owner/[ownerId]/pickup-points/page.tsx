"use client"
import { useState, useEffect } from 'react'

export default function OwnerPickupPointsPage({ params }: { params: { ownerId: string } }) {
  const ownerId = params.ownerId
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ carrier: '', facility_name: '', facility_address: '', recipient_name: '' })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errors, setErrors] = useState<{ [k: string]: string }>({})

  useEffect(() => {
    fetch(`/api/owners/${ownerId}/pickup-points`).then((r) => r.json()).then((j) => { if (j.ok) setList(j.pickup_points || []) })
  }, [ownerId])

  function validate() {
    const e: any = {}
    if (!form.facility_name || form.facility_name.trim().length < 2) e.facility_name = '拠点名は2文字以上で入力してください'
    if (!form.facility_address || form.facility_address.trim().length < 5) e.facility_address = '住所は5文字以上で入力してください'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: any) {
    e.preventDefault()
    if (!validate()) return
    setStatus('saving')
    try {
      const res = await fetch(`/api/owners/${ownerId}/pickup-points`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
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
    <div style={{ padding: 20, fontFamily: 'system-ui, -apple-system, Roboto, "Hiragino Kaku Gothic ProN", Meiryo, sans-serif' }}>
      <h2 style={{ marginBottom: 8 }}>受取拠点の登録</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
        <label style={{ display: 'grid' }}>
          <div style={{ fontSize: 12, color: '#333' }}>キャリア</div>
          <input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="例: japan_post" />
        </label>
        <label style={{ display: 'grid' }}>
          <div style={{ fontSize: 12, color: '#333' }}>拠点名 <span style={{ color: 'red' }}>*</span></div>
          <input value={form.facility_name} onChange={(e) => setForm({ ...form, facility_name: e.target.value })} placeholder="例: 渋谷郵便局" />
          {errors.facility_name && <div style={{ color: 'red', fontSize: 12 }}>{errors.facility_name}</div>}
        </label>
        <label style={{ display: 'grid' }}>
          <div style={{ fontSize: 12, color: '#333' }}>住所 <span style={{ color: 'red' }}>*</span></div>
          <input value={form.facility_address} onChange={(e) => setForm({ ...form, facility_address: e.target.value })} placeholder="住所を入力してください" />
          {errors.facility_address && <div style={{ color: 'red', fontSize: 12 }}>{errors.facility_address}</div>}
        </label>
        <label style={{ display: 'grid' }}>
          <div style={{ fontSize: 12, color: '#333' }}>受取人名</div>
          <input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} placeholder="例: 山田 太郎" />
        </label>
        <div>
          <button type="submit" disabled={status === 'saving'} style={{ padding: '8px 12px' }}>{status === 'saving' ? '保存中...' : '保存'}</button>
          <span style={{ marginLeft: 12 }}>{status === 'saved' ? '保存しました' : status === 'error' ? 'エラーが発生しました' : ''}</span>
        </div>
      </form>

      <h3 style={{ marginTop: 24 }}>登録済み拠点</h3>
      <ul style={{ paddingLeft: 16 }}>
        {list.map((p) => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <strong>{p.facility_name}</strong> — <span style={{ color: '#666' }}>{p.carrier}</span>
            <div style={{ fontSize: 13, color: '#444' }}>{p.facility_address}</div>
          </li>
        ))}
        {list.length === 0 && <li style={{ color: '#666' }}>登録された拠点はありません</li>}
      </ul>
    </div>
  )
}
