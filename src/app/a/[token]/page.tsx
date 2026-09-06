"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TagStatusCard from '../../_components/TagStatusCard'

type TagState =
  | { status: 'loading' }
  | { status: 'unactivated' }
  | { status: 'active'; item_name?: string }
  | { status: 'error'; message?: string }

export default function TokenPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const [state, setState] = useState<TagState>({ status: 'loading' })

  useEffect(() => {
    if (!token) return
    setState({ status: 'loading' })
    fetch(`/api/a/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (res.status === 404) return setState({ status: 'error', message: 'タグが見つかりません' })
          return setState({ status: 'error', message: body.error || '不明なエラー' })
        }
        const body = await res.json()
        if (body.status === 'unactivated') setState({ status: 'unactivated' })
        else if (body.status === 'active') setState({ status: 'active', item_name: body.item_name })
        else setState({ status: 'error', message: '不明なステータス' })
      })
      .catch(() => setState({ status: 'error', message: 'ネットワークエラー' }))
  }, [token])

  if (!token) return <div className="container card">トークンが指定されていません</div>

  return (
    <div className="container card stack">
      <h1 className="page-title">QRタグ: {token}</h1>

      {state.status === 'loading' && <p className="muted">読み込み中…</p>}

      {state.status === 'unactivated' && (
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

      {state.status === 'active' && (
        <div className="stack">
          <TagStatusCard status="active" itemName={state.item_name} />
          <p className="small-muted" style={{ margin: 0 }}>
            この持ち物を拾った方は、次の画面から届け出を行ってください。
          </p>
          <div className="row">
            <a href={`/a/${token}/report`} className="button primary lg">届け出る</a>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div className="panel stack-sm">
          <strong>エラー</strong>
          <p className="small-muted" style={{ margin: 0 }}>{state.message ?? 'エラーが発生しました'}</p>
        </div>
      )}
    </div>
  )
}
