"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TagStatusCard from '../../_components/TagStatusCard'
import { useTag } from './useTag'

export default function TokenPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const tag = useTag(token)

  // undefined = still checking, null = not logged in, string = owner id
  const [ownerId, setOwnerId] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !cancelled && setOwnerId(j?.owner?.id ?? null))
      .catch(() => !cancelled && setOwnerId(null))
    return () => {
      cancelled = true
    }
  }, [])

  if (!token) return <div className="container card">トークンが指定されていません</div>

  const registerHref =
    ownerId
      ? `/owner/${ownerId}/items/new?token=${encodeURIComponent(token)}`
      : `/owner/login?token=${encodeURIComponent(token)}`

  return (
    <div className="container card stack">
      <h1 className="page-title">QRタグ: {token}</h1>

      {tag.status === 'loading' && <p className="muted">読み込み中…</p>}

      {tag.status === 'unactivated' && (
        <div className="stack">
          <TagStatusCard status="unactivated" />
          <p className="small-muted" style={{ margin: 0 }}>
            {ownerId
              ? 'この持ち物の持ち主なら、そのまま登録できます。読み取ったトークンは登録画面に引き継がれます。'
              : 'この持ち物の持ち主の方はログインして登録してください。読み取ったトークンは登録画面に引き継がれます。'}
          </p>
          <div className="row">
            <a href={registerHref} className="button primary lg">
              {ownerId ? 'この持ち物を登録する' : '持ち主としてログインして登録'}
            </a>
          </div>
        </div>
      )}

      {tag.status === 'active' && (
        <div className="stack">
          <TagStatusCard status="active" itemName={tag.itemName} />
          <p className="small-muted" style={{ margin: 0 }}>
            この持ち物を拾った方は、次の画面から届け出を行ってください。
          </p>
          <div className="row">
            <a href={`/a/${token}/report`} className="button primary lg">届け出る</a>
          </div>
        </div>
      )}

      {tag.status === 'error' && (
        <div className="panel stack-sm">
          <strong>エラー</strong>
          <p className="small-muted" style={{ margin: 0 }}>{tag.message}</p>
        </div>
      )}
    </div>
  )
}
