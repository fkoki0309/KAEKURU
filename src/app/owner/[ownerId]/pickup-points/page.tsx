"use client"
import { useState, useEffect } from 'react'

export default function OwnerPickupPointsPage({ params }: { params: { ownerId: string } }) {
  const ownerId = params.ownerId
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ carrier: '', facility_name: '', facility_address: '', recipient_name: '' })
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch(`/api/owners/${ownerId}/pickup-points`).then((r) => r.json()).then((j) => { if (j.ok) setList(j.pickup_points || []) })
  }, [ownerId])

  async function handleSubmit(e: any) {
    e.preventDefault()
    setStatus('saving')
    const res = await fetch(`/api/owners/${ownerId}/pickup-points`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const j = await res.json()
    if (j.ok) {
      setList((s) => [j.pickup_point, ...s])
      setForm({ carrier: '', facility_name: '', facility_address: '', recipient_name: '' })
      setStatus('saved')
    } else {
      setStatus('error')
    }
    setTimeout(() => setStatus(''), 2000)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>受取拠点の登録</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <label>
          キャリア
          <input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />
        </label>
        <label>
          拠点名
          <input value={form.facility_name} onChange={(e) => setForm({ ...form, facility_name: e.target.value })} />
        </label>
        <label>
          住所
          <input value={form.facility_address} onChange={(e) => setForm({ ...form, facility_address: e.target.value })} />
        </label>
        <label>
          受取人名
          <input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
        </label>
        <button type="submit">保存</button>
        <div>{status}</div>
      </form>

      <h3 style={{ marginTop: 24 }}>登録済み拠点</h3>
      <ul>
        {list.map((p) => (
          <li key={p.id}>{p.facility_name} — {p.carrier} — {p.facility_address}</li>
        ))}
      </ul>
    </div>
  )
}
