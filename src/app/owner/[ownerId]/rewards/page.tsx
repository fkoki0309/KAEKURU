"use client"
import React, { useEffect, useState } from 'react'
import Screen from '../../../_components/Screen'

export default function OwnerRewardsPage({ params }: { params: { ownerId: string } }) {
  const ownerId = params.ownerId
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

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
  async function markSent(rewardId: string) {
    setSending(rewardId)
    try {
      const res = await fetch(`/api/rewards/${rewardId}/pay`, { method: 'POST' })
      const j = await res.json()
      if (j.ok) fetchList()
    } finally {
      setSending(null)
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied((c) => (c === text ? null : c)), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  const STATUS_LABEL: Record<string, string> = { pending: '未送金', paid: '送金済み', skipped: 'スキップ' }
  const METHOD_LABEL: Record<string, string> = { digital_gift: 'デジタルギフト', paypay: 'PayPay 送金' }

  return (
    <Screen title="お礼一覧">
      <p className="small-muted" style={{ margin: 0 }}>
        お礼は持ち主から拾得者への任意の謝礼です（遺失物法の報労金とは別のもの）。
        <strong>当サービスは送金を代行しません。</strong>
        下記の送り先へ持ち主ご自身で直接お送りいただき、完了したら「送金済みにする」を押してください。
      </p>

      {loading && <p className="muted">読み込み中…</p>}
      {!loading && list.length === 0 && (
        <p className="small-muted">お礼はまだありません。拾得者が受け取り先を登録し、受け取り確認をすると表示されます。</p>
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

              <div className="panel panel--muted stack-sm">
                <div className="small-muted">送り先: {r.finder_name || '（未設定）'}</div>
                <div className="small-muted">
                  受け取り方法: {r.payout_method ? METHOD_LABEL[r.payout_method] ?? r.payout_method : '（未設定）'}
                </div>
                {r.payout_account && (
                  <div className="row" style={{ gap: 8 }}>
                    <strong style={{ wordBreak: 'break-all' }}>{r.payout_account}</strong>
                    <button type="button" className="button ghost" onClick={() => copy(r.payout_account)}>
                      {copied === r.payout_account ? 'コピーしました' : 'コピー'}
                    </button>
                  </div>
                )}
              </div>

              {r.status !== 'paid' && (
                <div className="row">
                  <button className="button positive" disabled={sending === r.id} onClick={() => markSent(r.id)}>
                    {sending === r.id ? '更新中…' : '送金済みにする'}
                  </button>
                </div>
              )}
              {r.status === 'paid' && r.paid_at && (
                <div className="small-muted">送金済みにした日時: {new Date(r.paid_at).toLocaleString('ja-JP')}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
