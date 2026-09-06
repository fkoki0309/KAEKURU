"use client"
import React, { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import TagStatusCard from '../../../_components/TagStatusCard'
import BrandMark from '../../../_components/BrandMark'
import { useTag } from '../useTag'
import MethodChooser from './_parts/MethodChooser'
import DropoffFields from './_parts/DropoffFields'
import MailDestination from './_parts/MailDestination'
import PhotoField from './_parts/PhotoField'

type Method = 'choose' | 'dropoff' | 'mail'

export default function ReportPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const search = useSearchParams()
  const methodParam = search?.get('method') as 'dropoff' | 'mail' | null

  const tag = useTag(token)

  const [method, setMethod] = useState<Method>(methodParam ?? 'choose')
  const [foundLocation, setFoundLocation] = useState('')
  const [memo, setMemo] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  async function submit() {
    if (!token) return
    setSending(true)
    setResultMessage(null)
    try {
      const payload: Record<string, unknown> = {
        token,
        method: method === 'mail' ? 'mail' : 'dropoff',
      }
      if (photoUrl) payload.finder_photo_url = photoUrl
      if (method === 'dropoff') {
        payload.finder_memo = memo
        payload.dropoff_location = foundLocation
      }
      // For mail the server resolves the destination from the token — nothing
      // to send here.

      const res = await fetch('/api/return-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()
      if (!res.ok) setResultMessage(`送信失敗: ${body.error || res.status}`)
      else setResultMessage(`送信完了: ${body.return_case.case_code || body.return_case.id}`)
    } catch (err) {
      console.error(err)
      setResultMessage('送信中にエラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  if (!token) return <div className="container card">トークンが指定されていません</div>

  return (
    <div className="container card stack">
      <BrandMark height={32} />
      <div className="row">
        <a href={`/a/${token}`} className="button ghost">← 戻る</a>
        <h1 className="page-title" style={{ margin: 0 }}>届け出</h1>
      </div>

      {tag.status === 'loading' && <p className="muted">読み込み中…</p>}
      {tag.status === 'unactivated' && <TagStatusCard status="unactivated" />}
      {tag.status === 'error' && (
        <div className="panel stack-sm">
          <strong>エラー</strong>
          <p className="small-muted" style={{ margin: 0 }}>{tag.message}</p>
        </div>
      )}

      {tag.status === 'active' && (
        <>
          <TagStatusCard status="active" itemName={tag.itemName} />

          <section className="panel panel--dashed stack">
            {method === 'choose' && <MethodChooser onPick={setMethod} />}

            {method === 'dropoff' && (
              <DropoffFields
                location={foundLocation}
                memo={memo}
                onLocation={setFoundLocation}
                onMemo={setMemo}
                onBack={() => setMethod('choose')}
              />
            )}

            {method === 'mail' && <MailDestination token={token} onBack={() => setMethod('choose')} />}

            {method !== 'choose' && (
              <>
                <PhotoField photoUrl={photoUrl} onUploaded={setPhotoUrl} onError={setResultMessage} />
                <div className="row">
                  <button className="button primary" disabled={sending} onClick={submit}>
                    {sending ? '送信中…' : '送信する'}
                  </button>
                </div>
              </>
            )}

            {resultMessage && <p className="result">{resultMessage}</p>}
          </section>
        </>
      )}
    </div>
  )
}
