'use client'
import React from 'react'
import Link from 'next/link'
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
        <Link href={`/owner/${ownerId}`}>マイページ</Link>
        <Link href={`/owner/${ownerId}/notifications`}>通知</Link>
        <Link href={`/owner/${ownerId}/pickup-points`}>受取拠点</Link>
        <Link href={`/owner/${ownerId}/rewards`}>お礼</Link>
      </nav>
      <span className="spacer" />
      <span className="small-muted">ログイン中{account ? `: ${account}` : ''}</span>
      <button className="button" onClick={logout}>ログアウト</button>
    </header>
  )
}
