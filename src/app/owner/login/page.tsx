'use client'
import { useState } from 'react'
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
    <div style={{ maxWidth: 420, margin: '64px auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>持ち主ログイン</h1>
      <p style={{ fontSize: 13, color: '#666', marginTop: 0 }}>
        モック環境です。<code>test</code> / <code>test</code> でログインできます。
      </p>
      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ fontSize: 13 }}>メール</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 13 }}>パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: 10, cursor: loading ? 'default' : 'pointer' }}
        >
          {loading ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>
      {error && <p style={{ color: '#c00', marginTop: 12, fontSize: 14 }}>{error}</p>}
    </div>
  )
}
