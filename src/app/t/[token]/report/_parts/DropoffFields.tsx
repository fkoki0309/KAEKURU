import React from 'react'

type Props = {
  location: string
  memo: string
  onLocation: (v: string) => void
  onMemo: (v: string) => void
  onBack: () => void
}

export default function DropoffFields({ location, memo, onLocation, onMemo, onBack }: Props) {
  return (
    <>
      <div className="row-between">
        <h2 className="section-title" style={{ margin: 0 }}>どこかに届ける</h2>
        <button className="button ghost" onClick={onBack}>方法を変更</button>
      </div>
      <div className="field">
        <label>届けた場所 <span className="req">*</span></label>
        <input value={location} onChange={(e) => onLocation(e.target.value)} placeholder="例: 渋谷駅前交番" />
      </div>
      <div className="field">
        <label>メモ（任意）</label>
        <textarea value={memo} onChange={(e) => onMemo(e.target.value)} rows={3} placeholder="発見時の状況など" />
      </div>
    </>
  )
}
