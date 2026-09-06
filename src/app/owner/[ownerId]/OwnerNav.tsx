'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import BrandMark from '../../_components/BrandMark'

export default function OwnerNav({ ownerId, account }: { ownerId: string; account: string | null }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/owner/login')
    router.refresh()
  }

  return (
    <header className="app-header">
      <BrandMark height={30} />
      <nav>
        <a href={`/owner/${ownerId}`}>マイページ</a>
        <a href={`/owner/${ownerId}/notifications`}>通知</a>
        <a href={`/owner/${ownerId}/pickup-points`}>受取拠点</a>
        <a href={`/owner/${ownerId}/rewards`}>報酬</a>
      </nav>
      <span className="spacer" />
      <span className="small-muted">ログイン中{account ? `: ${account}` : ''}</span>
      <button className="button" onClick={logout}>ログアウト</button>
    </header>
  )
}
