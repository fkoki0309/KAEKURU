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

  const [sending, setSending] = useState<string | null>(null)
  async function pay(rewardId: string) {
    setSending(rewardId)
    try {
      const res = await fetch(`/api/rewards/${rewardId}/pay`, { method: 'POST' })
      const j = await res.json()
      if (j.ok) fetchList()
    } finally {
      setSending(null)
    }
  }

  const STATUS_LABEL: Record<string, string> = { pending: '送金待ち', paid: '送金済み', skipped: 'スキップ' }

  return (
    <Screen title="報酬一覧">
      {loading && <p className="muted">読み込み中…</p>}
      {!loading && list.length === 0 && (
        <p className="small-muted">報酬はありません。拾得者が受け取り先を登録し、受け取り確認をすると表示されます。</p>
      )}

      {list.length > 0 && (
        <ul className="list">
          {list.map((r) => (
            <li key={r.id} className="stack-sm">
              <div className="row">
                <strong>¥{r.amount.toLocaleString('ja-JP')}</strong>
                <span className={`pill ${r.status === 'paid' ? 'pill--paid' : 'pill--pending'}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <div className="small-muted">
                送り先: {r.finder_name || '（未設定）'}
              </div>
              {r.status !== 'paid' && (
                <div className="row">
                  <button className="button positive" disabled={sending === r.id} onClick={() => pay(r.id)}>
                    {sending === r.id ? '送金中…' : '報酬を送る'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
