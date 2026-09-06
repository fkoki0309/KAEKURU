"use client"
import React, { useState } from 'react'

/** Uploads the picked file via POST /api/uploads and reports the stored URL. */
export default function PhotoField({
  photoUrl,
  onUploaded,
  onError,
}: {
  photoUrl: string | null
  onUploaded: (url: string) => void
  onError: (message: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputId = 'finder-photo-input'

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('file read error'))
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataUrl }),
      })
      const body = await res.json()
      if (!res.ok) onError(`画像アップロード失敗: ${body.error || res.status}`)
      else onUploaded(body.url)
    } catch (err) {
      console.error(err)
      onError('画像アップロード中にエラーが発生しました')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="field">
      <label>写真（任意）</label>
      <input id={inputId} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPick} />
      <div className="row">
        <button className="button" onClick={() => document.getElementById(inputId)?.click()}>
          {uploading ? 'アップロード中…' : photoUrl ? '写真を差し替える' : '写真を撮る / 添付'}
        </button>
        {photoUrl && (
          <a href={photoUrl} target="_blank" rel="noreferrer" className="small">添付画像を表示</a>
        )}
      </div>
    </div>
  )
}
