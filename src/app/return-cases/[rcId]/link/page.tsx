"use client"
import { useState } from 'react'

export default function LinkFinderPage({ params }: { params: { rcId: string } }) {
  const rcId = params.rcId
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e: any) {
    e.preventDefault()
    setMsg('送信中...')
    const res = await fetch(`/api/return-cases/${rcId}/link-finder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone }) })
    const j = await res.json()
    if (res.ok) setMsg('紐付け完了')
    else setMsg(j.error || 'エラー')
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>後から紐付け（拾得者）</h2>
      <form onSubmit={submit}>
        <div>
          <label>お名前（任意）</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>メール（通知受け取り用）</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>電話（任意）</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button type="submit">紐付けする</button>
      </form>
      <div>{msg}</div>
    </div>
  )
}
