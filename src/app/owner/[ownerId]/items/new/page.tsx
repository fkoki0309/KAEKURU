"use client"
import React, { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

// NOTE: レイアウト確認用のスタブ。送信は後続ステップで
// POST /api/tags/activate（{ token, item_name, item_photo_url } / Cookie 認証）に接続し、
// 成功後はダッシュボードへ遷移する。
export default function RegisterItemPage() {
  const params = useParams() as { ownerId?: string }
  const ownerId = params?.ownerId ?? ''
  const search = useSearchParams()

  const [token, setToken] = useState(search?.get('token') ?? '')
  const [itemName, setItemName] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const fileInputId = 'register-photo-input'

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // スタブ: まだ API は呼ばない
    setDone(true)
  }

  return (
    <div className="container card stack">
      <div className="row">
        <a href={`/owner/${ownerId}`} className="button ghost">← マイページ</a>
        <h1 className="page-title" style={{ margin: 0 }}>持ち物を登録</h1>
      </div>

      {done ? (
        <div className="panel stack-sm" style={{ alignItems: 'flex-start' }}>
          <span className="pill pill--active">登録しました（デモ）</span>
          <p className="small-muted" style={{ margin: 0 }}>
            「{itemName || '名称未設定'}」をトークン <code>{token || '—'}</code> に紐付けました。
          </p>
          <a href={`/owner/${ownerId}`} className="button primary">マイページに戻る</a>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="stack-sm">
          <div className="field">
            <label>QRトークン <span className="req">*</span></label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="シールのQRを読み取ると自動で入ります"
            />
            <span className="small-muted">例: demo-token-123</span>
          </div>

          <div className="field">
            <label>持ち物の名前 <span className="req">*</span></label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="例: 黒い長財布"
            />
          </div>

          <div className="field">
            <label>写真（任意）</label>
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setUploading(true)
                try {
                  const dataUrl: string = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(String(reader.result))
                    reader.onerror = () => reject(new Error('read error'))
                    reader.readAsDataURL(f)
                  })
                  setPhotoUrl(dataUrl)
                } finally {
                  setUploading(false)
                }
              }}
            />
            <div className="row">
              <button type="button" className="button" onClick={() => document.getElementById(fileInputId)?.click()}>
                {uploading ? '読み込み中…' : photoUrl ? '写真を差し替える' : '写真を選ぶ'}
              </button>
              {photoUrl && <img src={photoUrl} alt="preview" style={{ height: 48, borderRadius: 6 }} />}
            </div>
          </div>

          <div className="row">
            <button type="submit" className="button primary" disabled={!token || !itemName}>登録する</button>
          </div>
        </form>
      )}
    </div>
  )
}
