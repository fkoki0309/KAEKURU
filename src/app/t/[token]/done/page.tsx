"use client"
import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Screen from '../../../_components/Screen'

export default function ReportDonePage() {
  const search = useSearchParams()
  const code = search?.get('code') ?? '—'
  const rc = search?.get('rc') ?? ''
  const method = search?.get('method')

  return (
    <Screen brand title="届け出を受け付けました">
      <p className="small-muted" style={{ margin: 0 }}>
        ご協力ありがとうございます。持ち主に通知が届きました。
      </p>

      <div className="panel stack-sm">
        <span className="small-muted">受付番号</span>
        <strong style={{ fontSize: 'clamp(20px, 6vw, 24px)', letterSpacing: '0.04em', wordBreak: 'break-all' }}>
          {code}
        </strong>
        <span className="small-muted">
          この番号は控えておいてください。あとで状況確認や報酬の受け取り登録に使います。
        </span>
      </div>

      {method === 'mail' && (
        <div className="panel panel--muted stack-sm">
          <strong className="section-title" style={{ margin: 0 }}>郵送の方へ</strong>
          <span className="small-muted">
            前の画面の宛先（◯◯郵便局 留め）に発送し、受付番号 <strong>{code}</strong> を書いたメモを荷物に同梱してください。
          </span>
        </div>
      )}

      <div className="stack-sm">
        <strong className="section-title" style={{ margin: 0 }}>報酬を受け取る場合</strong>
        <p className="small-muted" style={{ margin: 0 }}>
          受け取り先（お名前・連絡先）を登録すると、持ち主からのお礼を受け取れます。登録しなくても届け出は完了しています。
        </p>
        {rc && (
          <Link href={`/return-cases/${rc}/link`} className="button primary block">
            受け取り先を登録する
          </Link>
        )}
        <Link href="/" className="button ghost">ホームへ</Link>
      </div>
    </Screen>
  )
}
