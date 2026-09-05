"use client"
import { useEffect, useState } from 'react'

export default function OwnerRewardsPage({ params }: { params: { ownerId: string } }) {
  const ownerId = params.ownerId
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchList() }, [ownerId])

  async function fetchList() {
    setLoading(true)
    const res = await fetch(`/api/owners/${ownerId}/rewards`)
    const j = await res.json()
    if (j.ok) setList(j.rewards || [])
    setLoading(false)
  }

  async function pay(rewardId: string) {
    const res = await fetch(`/api/rewards/${rewardId}/pay`, { method: 'POST' })
    const j = await res.json()
    if (j.ok) fetchList()
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>報酬一覧</h2>
      {loading && <div>読み込み中…</div>}
      <ul>
        {list.map(r => (
          <li key={r.id} style={{ marginBottom: 12 }}>
            <div>金額: ¥{r.amount} — ステータス: {r.status}</div>
            <div>返却ケース: {r.return_case_id}</div>
            {r.status !== 'paid' && <button onClick={() => pay(r.id)}>支払済みにする (mock)</button>}
          </li>
        ))}
        {list.length === 0 && <li>報酬はありません</li>}
      </ul>
    </div>
  )
}
