"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  // undefined = 確認中, null = 未ログイン, string = ログイン中の owner id
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

  const [code, setCode] = useState('')
  function goToTag(e: React.FormEvent) {
    e.preventDefault()
    const t = code.trim()
    if (t) router.push(`/a/${encodeURIComponent(t)}`)
  }

  return (
    <div className="container stack">
      <div className="card stack">
        <div className="stack-sm">
          <h1 className="page-title" style={{ margin: 0 }}>KAEKURU</h1>
          <p className="muted" style={{ margin: 0 }}>
            QRシールで、落とし物が持ち主に戻る。拾った人は匿名のまま、持ち主は個人情報を渡さずに受け取れます。
          </p>
        </div>
      </div>

      <div className="card stack">
        <h2 className="section-title" style={{ margin: 0 }}>持ち主の方</h2>
        <p className="small-muted" style={{ margin: 0 }}>
          シールを持ち物に貼って登録。落とし物の通知を受け取り、受け取り確認と報酬の送金を行います。
        </p>
        <div className="row">
          {ownerId ? (
            <a href={`/owner/${ownerId}`} className="button primary">マイページへ</a>
          ) : (
            <a href="/owner/login" className="button primary">ログイン</a>
          )}
        </div>
      </div>

      <div className="card stack">
        <h2 className="section-title" style={{ margin: 0 }}>拾った方（ログイン不要）</h2>
        <p className="small-muted" style={{ margin: 0 }}>
          シールのQRコードを読み取ると、届け出フォームが開きます。QRが読み取れないときは、シールに記載のコードを入力してください。
        </p>
        <form onSubmit={goToTag} className="row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="例: demo-token-123"
            aria-label="シールのコード"
            style={{ maxWidth: 280 }}
          />
          <button type="submit" className="button" disabled={!code.trim()}>届け出フォームへ</button>
        </form>
      </div>

      <div className="card stack">
        <h2 className="section-title" style={{ margin: 0 }}>使い方</h2>
        <ol className="stack-sm" style={{ margin: 0, paddingLeft: 20 }}>
          <li>持ち主がシールを持ち物に貼り、アプリで登録する</li>
          <li>持ち物をなくす</li>
          <li>拾った人がQRを読み取り、届け方（手渡し / 郵送）を選んで届け出る</li>
          <li>持ち主に通知が届き、受け取る</li>
          <li>受け取り確認をすると、拾った人がログイン済みなら報酬が送られる</li>
        </ol>
      </div>
    </div>
  )
}
