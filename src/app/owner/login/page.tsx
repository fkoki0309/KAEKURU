'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OwnerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('test')
  const [password, setPassword] = useState('test')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) {
        setError(j.error || 'ログインに失敗しました')
        return
      }
      router.push(`/owner/${j.owner.id}/notifications`)
      router.refresh()
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container card stack" style={{ maxWidth: 420 }}>
      <div className="stack-sm">
        <h1 className="page-title" style={{ margin: 0 }}>持ち主ログイン</h1>
        <p className="small-muted" style={{ margin: 0 }}>
          モック環境です。<code>test</code> / <code>test</code> でログインできます。
        </p>
      </div>

      <form onSubmit={onSubmit} className="stack-sm">
        <div className="field">
          <label>メール</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="button primary block" disabled={loading}>
          {loading ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>

      {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
    </div>
  )
}
