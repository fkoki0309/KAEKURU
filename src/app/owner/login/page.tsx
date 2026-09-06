'use client'
import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Screen from '../../_components/Screen'

export default function OwnerLoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  // Carried over when the owner scanned an unregistered tag's QR.
  const scannedToken = search?.get('token') ?? null
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
      const dest = scannedToken
        ? `/owner/${j.owner.id}/items/new?token=${encodeURIComponent(scannedToken)}`
        : `/owner/${j.owner.id}`
      router.push(dest)
      router.refresh()
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen
      brand
      width={420}
      title="持ち主ログイン"
      subtitle={
        scannedToken ? (
          <>ログイン後、読み取ったQR（<code>{scannedToken}</code>）の登録に進みます。</>
        ) : undefined
      }
    >
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
    </Screen>
  )
}
