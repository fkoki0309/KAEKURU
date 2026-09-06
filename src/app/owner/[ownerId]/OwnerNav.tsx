'use client'
import { useRouter } from 'next/navigation'

export default function OwnerNav({ ownerId, itemName }: { ownerId: string; itemName: string | null }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/owner/login')
    router.refresh()
  }

  const linkStyle = { fontSize: 13, color: '#0366d6', textDecoration: 'none' }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 20px',
        borderBottom: '1px solid #eee',
        fontFamily: 'system-ui',
      }}
    >
      <span style={{ fontSize: 13, color: '#666' }}>
        ログイン中{itemName ? `: ${itemName}` : ''}
      </span>
      <nav style={{ display: 'flex', gap: 12 }}>
        <a href={`/owner/${ownerId}/notifications`} style={linkStyle}>通知</a>
        <a href={`/owner/${ownerId}/pickup-points`} style={linkStyle}>受取拠点</a>
        <a href={`/owner/${ownerId}/rewards`} style={linkStyle}>報酬</a>
      </nav>
      <button
        onClick={logout}
        style={{ marginLeft: 'auto', fontSize: 13, padding: '4px 10px', cursor: 'pointer' }}
      >
        ログアウト
      </button>
    </header>
  )
}
