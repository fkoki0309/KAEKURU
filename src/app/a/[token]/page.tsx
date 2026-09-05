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
  const [sending, setSending] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

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
          else if (body.status === 'active') setState({ status: 'active', item_name: body.item_name })
          else setState({ status: 'error', message: '不明なステータス' })
        })
      })
      .catch(() => setState({ status: 'error', message: 'ネットワークエラー' }))
  }, [token])

  if (!token) return <div>トークンが指定されていません</div>

  return (
    <div style={{ maxWidth: 720, margin: '32px auto', fontFamily: 'system-ui, -apple-system', padding: 20 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>QRタグ: {token}</h1>
      {state.status === 'loading' && <p>読み込み中…</p>}

      {state.status === 'unactivated' && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>このタグは未登録です</h2>
          <p>持ち主の方はログインしてタグを登録してください。</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/owner/login" style={{ padding: '8px 12px', background: '#0f62fe', color: 'white', borderRadius: 6, textDecoration: 'none' }}>持ち主として登録</a>
            <a href="#report" style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', textDecoration: 'none', color: '#333' }}>拾得者として届け出</a>
          </div>
        </div>
      )}

      {state.status === 'active' && (
        <div style={{ border: '1px solid #e6e6e6', padding: 16, borderRadius: 8 }}>
          <h2 style={{ marginTop: 0 }}>このタグは登録済みです</h2>
          <p><strong>持ち物:</strong> {state.item_name ?? '—'}</p>
          <p>拾得者は以下のフォームから届け出を行ってください。</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="#report" style={{ padding: '8px 12px', background: '#198038', color: 'white', borderRadius: 6, textDecoration: 'none' }}>拾得者フォームへ</a>
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

      <section id="report" style={{ border: '1px dashed #ddd', padding: 16, borderRadius: 8 }}>
        <h3>届け出フォーム (簡易プレビュー)</h3>
        <p>ここは拾得者が使うフォームのプレースホルダです。STEP4 で本フォームを実装します。</p>
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="見つけた場所 (任意)" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
          <textarea placeholder="メモ (任意)" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} rows={3} />
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            <input value={foundLocation} onChange={(e) => setFoundLocation(e.target.value)} placeholder="見つけた場所 (任意)" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="メモ (任意)" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} rows={3} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '8px 12px' }}>写真を撮る/添付</button>
              <button disabled={sending} onClick={async () => {
                setSending(true)
                setResultMessage(null)
                try {
                  const res = await fetch('/api/return-cases', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, method: 'dropoff', found_location: foundLocation, finder_memo: memo })
                  })
                  const body = await res.json()
                  if (!res.ok) setResultMessage(`送信失敗: ${body.error || res.status}`)
                  else setResultMessage(`送信完了: ${body.return_case.case_code || body.return_case.id}`)
                } catch (err) {
                  setResultMessage('送信中にエラーが発生しました')
                } finally {
                  setSending(false)
                }
              }} style={{ padding: '8px 12px', background: '#0f62fe', color: 'white' }}>{sending ? '送信中…' : '送信 (モック)'}</button>
            </div>
            {resultMessage && <p>{resultMessage}</p>}
          </div>
        </div>
      </section>

    </div>
  )
}
