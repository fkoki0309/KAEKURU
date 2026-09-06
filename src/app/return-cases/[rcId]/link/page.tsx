"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Screen from '../../../_components/Screen'

export default function LinkFinderPage({ params }: { params: { rcId: string } }) {
  const rcId = params.rcId
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/return-cases/${rcId}/link-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || !j.ok) {
        setError(j.error || '登録に失敗しました')
        return
      }
      router.push(`/return-cases/${rcId}/link/done${j.reward ? '?reward=1' : ''}`)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen brand title="受け取り先の登録">
      <p className="small-muted" style={{ margin: 0 }}>
        お名前を登録すると、持ち主からのお礼（¥1,000）を受け取れます。
      </p>

      <form onSubmit={submit} className="stack-sm">
        <div className="field">
          <label>お名前 <span className="req">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 拾い 花子" />
        </div>
        <div className="field">
          <label>メール（任意・通知の受け取り用）</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>電話（任意）</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="row">
          <button type="submit" className="button primary" disabled={submitting || !name.trim()}>
            {submitting ? '登録中…' : '登録する'}
          </button>
        </div>
      </form>

      {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
    </Screen>
  )
}
