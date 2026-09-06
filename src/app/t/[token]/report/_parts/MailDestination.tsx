"use client"
import React, { useEffect, useState } from 'react'

export type ShippingDestination = {
  carrier: string | null
  address_label: string | null
  facility_name: string | null
  facility_address: string | null
  recipient_name: string | null
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; destination: ShippingDestination | null }
  | { status: 'error' }

/**
 * Shows the anonymous 局留め destination for the token. The finder only ever
 * sees 局名・住所・受取人名 — this component fetches the finder-facing
 * GET /api/t/:token/shipping-destination endpoint, never owner-scoped APIs.
 */
export default function MailDestination({ token, onBack }: { token: string; onBack: () => void }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch(`/api/t/${token}/shipping-destination`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok || !body.ok) setState({ status: 'error' })
        else setState({ status: 'ready', destination: body.destination ?? null })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <>
      <div className="row-between">
        <h2 className="section-title" style={{ margin: 0 }}>郵送する</h2>
        <button className="button ghost" onClick={onBack}>方法を変更</button>
      </div>

      {state.status === 'loading' && <p className="small-muted" style={{ margin: 0 }}>お届け先を確認中…</p>}
      {state.status === 'error' && (
        <p className="small-muted" style={{ margin: 0 }}>お届け先の取得に失敗しました。時間をおいて再度お試しください。</p>
      )}

      {state.status === 'ready' && !state.destination && (
        <p className="small-muted" style={{ margin: 0 }}>
          持ち主がまだ受取先を登録していません。「送信する」で届け出だけ先に送れます。
        </p>
      )}

      {state.status === 'ready' && state.destination && (
        <div className="panel panel--muted stack-sm">
          <span className="small-muted">この宛先で発送してください</span>
          <div>
            <div><strong>{state.destination.address_label ?? state.destination.facility_name ?? '—'}</strong></div>
            <div>{state.destination.facility_address ?? '—'}</div>
            <div>受取人: {state.destination.recipient_name ?? '—'} 様</div>
          </div>
          <span className="small-muted">
            送信後に表示される受付番号（FND-xxxxx）を書いたメモを、荷物に同梱してください。
          </span>
        </div>
      )}
    </>
  )
}
