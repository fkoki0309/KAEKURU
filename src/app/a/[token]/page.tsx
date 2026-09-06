"use client"
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type TagState =
  | { status: 'loading' }
  | { status: 'unactivated' }
  | { status: 'active'; item_name?: string }
  | { status: 'error'; message?: string }

export default function TokenPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const [state, setState] = useState<TagState>({ status: 'loading' })
  const [foundLocation, setFoundLocation] = useState('')
  const [memo, setMemo] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [method, setMethod] = useState<'choose' | 'dropoff' | 'mail'>('choose')
  const [mailName, setMailName] = useState('')
  const [mailAddress, setMailAddress] = useState('')
  const [mailPhone, setMailPhone] = useState('')
  const [fileUploading, setFileUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const fileInputId = 'finder-photo-input'

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
        return res.json().then((body) => {
          if (body.status === 'unactivated') setState({ status: 'unactivated' })
          else if (body.status === 'active') {
            setState({ status: 'active', item_name: body.item_name })
            // store owner id on window for later use
            ;(window as any).__kaekuru_owner_id__ = body.owner_id ?? null
          } else setState({ status: 'error', message: '不明なステータス' })
        })
      })
      .catch(() => setState({ status: 'error', message: 'ネットワークエラー' }))
  }, [token])

  if (!token) return <div>トークンが指定されていません</div>

  return (
    <div className="container card">
      <h1 style={{ fontSize: 24, marginBottom: 12, fontWeight: 600 }}>QRタグ: {token}</h1>
      {state.status === 'loading' && <p>読み込み中…</p>}

      {state.status === 'unactivated' && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>このタグは未登録です</h2>
          <p>持ち主の方はログインしてタグを登録してください。</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/owner/login" className="button primary">持ち主として登録</a>
            <a href={`/a/${token}/report`} className="button">拾得者として届け出</a>
          </div>
        </div>
      )}

      {state.status === 'active' && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>このタグは登録済みです</h2>
          <p><strong>持ち物:</strong> {state.item_name ?? '—'}</p>
          <p>拾得者は以下のフォームから届け出を行ってください。</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`/a/${token}/report`} style={{ padding: '10px 14px', background: '#198038', color: 'white', borderRadius: 8, textDecoration: 'none', boxShadow: '0 4px 12px rgba(25,128,56,0.12)' }}>拾得者フォームへ</a>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div>
          <h2>エラー</h2>
          <p>{state.message ?? 'エラーが発生しました'}</p>
        </div>
      )}
      <hr style={{ margin: '24px 0' }} />

      <section style={{ border: '1px dashed #ddd', padding: 16, borderRadius: 8 }}>
        <h3>届け出</h3>
        <p>以下から届け出方法を選び、次へ進んでください。</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <a href={`/a/${token}/report?method=dropoff`} className="button">どこかに届ける</a>
          <a href={`/a/${token}/report?method=mail`} className="button">郵送する</a>
          {/* 送り状発行は届出フォームの郵送モードで行うため、ここではボタンを表示しない */}
        </div>
      </section>

    </div>
  )
}
