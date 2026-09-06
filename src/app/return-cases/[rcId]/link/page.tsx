"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Screen from '../../../_components/Screen'

type PayoutMethod = 'digital_gift' | 'paypay'

const looksEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const looksPhone = (v: string) => /^0\d{9,10}$/.test(v.replace(/[-\s]/g, ''))

export default function LinkFinderPage({ params }: { params: { rcId: string } }) {
  const rcId = params.rcId
  const router = useRouter()
  const [name, setName] = useState('')
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('digital_gift')
  const [payoutAccount, setPayoutAccount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const account = payoutAccount.trim()
  const accountValid =
    payoutMethod === 'digital_gift' ? looksEmail(account) : looksEmail(account) || looksPhone(account)
  const canSubmit = !submitting && name.trim().length > 0 && accountValid

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/return-cases/${rcId}/link-finder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          payout_method: payoutMethod,
          payout_account: account,
          // keep email/phone populated for existing reward-trigger logic
          email: looksEmail(account) ? account : '',
          phone: looksEmail(account) ? '' : account,
        }),
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
        お名前と受け取り方法を登録すると、持ち主が直接お礼（¥1,000）をお送りします。
        当サービスは送金を代行しません。登録しなくても届け出は完了しています。
      </p>

      <form onSubmit={submit} className="stack-sm">
        <div className="field">
          <label>お名前 <span className="req">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 拾い 花子" />
        </div>

        <div className="field">
          <label>受け取り方法 <span className="req">*</span></label>
          <div className="stack-sm" style={{ gap: 6 }}>
            <label className="row" style={{ gap: 8 }}>
              <input
                type="radio"
                name="payoutMethod"
                checked={payoutMethod === 'digital_gift'}
                onChange={() => setPayoutMethod('digital_gift')}
                style={{ width: 'auto' }}
              />
              <span>デジタルギフト（メールで受け取り）</span>
            </label>
            <label className="row" style={{ gap: 8 }}>
              <input
                type="radio"
                name="payoutMethod"
                checked={payoutMethod === 'paypay'}
                onChange={() => setPayoutMethod('paypay')}
                style={{ width: 'auto' }}
              />
              <span>PayPay 送金</span>
            </label>
          </div>
        </div>

        <div className="field">
          <label>
            {payoutMethod === 'digital_gift' ? '受取用メールアドレス' : 'PayPay 受取用（メール または 携帯番号）'}{' '}
            <span className="req">*</span>
          </label>
          <input
            value={payoutAccount}
            onChange={(e) => setPayoutAccount(e.target.value)}
            placeholder={payoutMethod === 'digital_gift' ? '例: hana@example.com' : '例: hana@example.com / 09012345678'}
          />
          <span className="small-muted">
            {payoutMethod === 'digital_gift'
              ? 'このアドレスにギフトコードを送ります。'
              : 'PayPay に登録済みのメールまたは携帯番号を入力してください。'}
          </span>
        </div>

        <div className="row">
          <button type="submit" className="button primary" disabled={!canSubmit}>
            {submitting ? '登録中…' : '登録する'}
          </button>
        </div>
      </form>

      {!accountValid && account.length > 0 && (
        <p className="small-muted" style={{ margin: 0 }}>
          {payoutMethod === 'digital_gift'
            ? 'メールアドレスの形式で入力してください。'
            : 'メールアドレス、または 0 から始まる携帯番号で入力してください。'}
        </p>
      )}
      {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
    </Screen>
  )
}
