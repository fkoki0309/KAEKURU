"use client"
import React, { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Screen from '../../../_components/Screen'
import TagStatusCard from '../../../_components/TagStatusCard'
import { useTag } from '../useTag'
import MethodChooser from './_parts/MethodChooser'
import DropoffFields from './_parts/DropoffFields'
import MailDestination from './_parts/MailDestination'
import PhotoField from './_parts/PhotoField'

type Method = 'choose' | 'dropoff' | 'mail'

export default function ReportPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const router = useRouter()
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
      if (!res.ok) {
        setResultMessage(`送信失敗: ${body.error || res.status}`)
        return
      }
      const rc = body.return_case
      const q = new URLSearchParams({
        code: rc.case_code ?? rc.id,
        rc: rc.id,
        method: method === 'mail' ? 'mail' : 'dropoff',
      })
      router.push(`/t/${token}/done?${q.toString()}`)
    } catch (err) {
      console.error(err)
      setResultMessage('送信中にエラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  if (!token) return <Screen brand title="届け出">トークンが指定されていません</Screen>

  return (
    <Screen brand back={`/t/${token}`} title="届け出">
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

          <div className="panel panel--muted stack-sm">
            <p className="small-muted" style={{ margin: 0 }}>
              拾得から<strong>1週間以内</strong>に発送・お渡しください。1週間を過ぎると、拾得者が受け取れる権利（報労金・所有権）がなくなることがあります（遺失物法）。
            </p>
            <p className="small-muted" style={{ margin: 0 }}>
              すぐに返せない場合は、お近くの交番・警察署にお届けください。
            </p>
          </div>

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
    </Screen>
  )
}
