import React from 'react'

type Props = {
  status: 'active' | 'unactivated'
  itemName?: string | null
}

/** Shared "this tag is (not) registered" summary used by the tag screen and the report screen. */
export default function TagStatusCard({ status, itemName }: Props) {
  if (status === 'unactivated') {
    return (
      <div className="panel stack-sm">
        <span className="pill pill--inactive">未登録</span>
        <p className="small-muted" style={{ margin: 0 }}>
          このタグはまだ持ち物と紐付けられていません。
        </p>
      </div>
    )
  }

  return (
    <div className="panel stack-sm">
      <span className="pill pill--active">登録済み</span>
      <p style={{ margin: 0 }}>
        <strong>持ち物:</strong> {itemName || '—'}
      </p>
    </div>
  )
}
