"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import TagStatusCard from '../../_components/TagStatusCard'
import { useTag } from './useTag'

export default function TokenPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const tag = useTag(token)

  if (!token) return <div className="container card">トークンが指定されていません</div>

  return (
    <div className="container card stack">
      <h1 className="page-title">QRタグ: {token}</h1>

      {tag.status === 'loading' && <p className="muted">読み込み中…</p>}

      {tag.status === 'unactivated' && (
        <div className="stack">
          <TagStatusCard status="unactivated" />
          <p className="small-muted" style={{ margin: 0 }}>
            持ち主の方はログインしてタグを登録してください。
          </p>
          <div className="row">
            <a href="/owner/login" className="button primary">持ち主としてログイン</a>
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
