"use client"
import React, { useEffect, useState } from 'react'
import Screen from '../../../_components/Screen'

export default function OwnerRewardsPage({ params }: { params: { ownerId: string } }) {
  const ownerId = params.ownerId
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId])

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
    <Screen title="報酬一覧">
      {loading && <p className="muted">読み込み中…</p>}
      {!loading && list.length === 0 && <p className="small-muted">報酬はありません</p>}

      {list.length > 0 && (
        <ul className="list">
          {list.map((r) => (
            <li key={r.id} className="stack-sm">
              <div className="row">
                <strong>¥{r.amount}</strong>
                <span className={`pill ${r.status === 'paid' ? 'pill--paid' : 'pill--pending'}`}>{r.status}</span>
              </div>
              <div className="small-muted">返却ケース: {r.return_case_id}</div>
              {r.status !== 'paid' && (
                <div className="row">
                  <button className="button positive" onClick={() => pay(r.id)}>支払済みにする</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
