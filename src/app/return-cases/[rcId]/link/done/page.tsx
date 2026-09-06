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
            ? '持ち主が登録した送り先へ直接お礼（¥1,000）をお送りします。当サービスは送金を代行しません。'
            : '持ち主が受け取りを確認すると、登録した送り先へ持ち主が直接お礼（¥1,000）をお送りします。'}
        </p>
      </div>

      <div className="row">
        <Link href="/" className="button ghost">ホームへ</Link>
      </div>
    </Screen>
  )
}
