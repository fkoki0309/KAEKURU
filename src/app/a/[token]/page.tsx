"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import Screen from '../../_components/Screen'
import TagStatusCard from '../../_components/TagStatusCard'
import { useCurrentOwnerId } from '../../_hooks/useCurrentOwnerId'
import { useTag } from './useTag'

export default function TokenPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const tag = useTag(token)
  const ownerId = useCurrentOwnerId()

  if (!token) return <Screen brand title="QRタグ">トークンが指定されていません</Screen>

  const registerHref = ownerId
    ? `/owner/${ownerId}/items/new?token=${encodeURIComponent(token)}`
    : `/owner/login?token=${encodeURIComponent(token)}`

  return (
    <Screen brand title={`QRタグ: ${token}`}>
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
    </Screen>
  )
}
