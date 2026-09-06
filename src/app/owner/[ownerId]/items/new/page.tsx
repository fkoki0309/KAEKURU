"use client"
import React, { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Screen from '../../../../_components/Screen'

export default function RegisterItemPage() {
  const params = useParams() as { ownerId?: string }
  const ownerId = params?.ownerId ?? ''
  const search = useSearchParams()
  const isFirst = search?.get('first') === '1' // ダッシュボードから誘導された初回登録
  const scannedToken = search?.get('token') ?? '' // QR から引き継がれたトークン

  const [token, setToken] = useState(scannedToken)
  const [itemName, setItemName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const fileInputId = 'register-photo-input'

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    setError(null)
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('read error'))
        reader.readAsDataURL(f)
      })
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataUrl }),
      })
      const body = await res.json()
      if (!res.ok) setError(`画像アップロード失敗: ${body.error || res.status}`)
      else setPhotoUrl(body.url)
    } catch (err) {
      console.error(err)
      setError('画像アップロード中にエラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/tags/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), item_name: itemName.trim(), item_photo_url: photoUrl }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.ok) {
        setError(body.error || '登録に失敗しました')
        return
      }
      setDone(true)
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Screen title="持ち物を登録しました">
        <div className="panel stack-sm" style={{ alignItems: 'flex-start' }}>
          <span className="pill pill--active">登録完了</span>
          <p className="small-muted" style={{ margin: 0 }}>
            「{itemName || '名称未設定'}」を登録しました。
          </p>
        </div>
        {isFirst && (
          <div className="panel panel--dashed stack-sm" style={{ alignItems: 'flex-start' }}>
            <strong className="section-title" style={{ margin: 0 }}>次に: 受取拠点の登録（郵送に備えて）</strong>
            <p className="small-muted" style={{ margin: 0 }}>
              拾得者が「郵送」を選んだときの局留め先です。あとで登録もできます。
            </p>
            <div className="row">
              <a href={`/owner/${ownerId}/pickup-points`} className="button primary">受取拠点を登録</a>
              <a href={`/owner/${ownerId}`} className="button">あとで</a>
            </div>
          </div>
        )}
        {!isFirst && (
          <div className="row">
            <a href={`/owner/${ownerId}`} className="button primary">マイページに戻る</a>
          </div>
        )}
      </Screen>
    )
  }

  return (
    <Screen
      title="持ち物を登録"
      back={isFirst ? undefined : `/owner/${ownerId}`}
      subtitle={isFirst ? 'はじめに、シールを貼った持ち物を1つ登録してください。' : undefined}
    >
      <form onSubmit={onSubmit} className="stack-sm">
        <div className="field">
          <label>QRトークン <span className="req">*</span></label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="シールのQRを読み取ると自動で入ります"
          />
          <span className="small-muted">
            {scannedToken ? 'QRから読み取りました（必要なら修正できます）' : '例: demo-token-123'}
          </span>
        </div>

        <div className="field">
          <label>持ち物の名前 <span className="req">*</span></label>
          <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="例: 黒い長財布" />
        </div>

        <div className="field">
          <label>写真（任意）</label>
          <input id={fileInputId} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickFile} />
          <div className="row">
            <button type="button" className="button" onClick={() => document.getElementById(fileInputId)?.click()}>
              {uploading ? 'アップロード中…' : photoUrl ? '写真を差し替える' : '写真を選ぶ'}
            </button>
            {photoUrl && <img src={photoUrl} alt="preview" style={{ height: 48, borderRadius: 6 }} />}
          </div>
        </div>

        <div className="row">
          <button type="submit" className="button primary" disabled={submitting || uploading || !token.trim() || !itemName.trim()}>
            {submitting ? '登録中…' : '登録する'}
          </button>
        </div>
      </form>

      {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
    </Screen>
  )
}
