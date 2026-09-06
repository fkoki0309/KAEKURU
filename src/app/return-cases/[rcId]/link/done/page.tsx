"use client"
import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Screen from '../../../../_components/Screen'

export default function LinkDonePage() {
  const search = useSearchParams()
  const hasReward = search?.get('reward') === '1'

  return (
    <Screen brand title="受け取り先を登録しました">
      <div className="panel stack-sm">
        <span className="pill pill--active">登録完了</span>
        <p className="small-muted" style={{ margin: 0 }}>
          {hasReward
            ? '持ち主がお礼（¥1,000）を送金します。完了したら通知されます。'
            : '持ち主が受け取りを確認すると、お礼（¥1,000）が送られます。'}
        </p>
      </div>

      <div className="row">
        <Link href="/" className="button ghost">ホームへ</Link>
      </div>
    </Screen>
  )
}
