'use client'
import React from 'react'
import { useRouter } from 'next/navigation'

export default function OwnerNav({ ownerId, itemName }: { ownerId: string; itemName: string | null }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/owner/login')
    router.refresh()
  }

  return (
    <header className="app-header">
      <span className="small-muted">ログイン中{itemName ? `: ${itemName}` : ''}</span>
      <nav>
        <a href={`/owner/${ownerId}/notifications`}>通知</a>
        <a href={`/owner/${ownerId}/pickup-points`}>受取拠点</a>
        <a href={`/owner/${ownerId}/rewards`}>報酬</a>
      </nav>
      <span className="spacer" />
      <button className="button" onClick={logout}>ログアウト</button>
    </header>
  )
}
