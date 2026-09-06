import { redirect } from 'next/navigation'
import { currentOwner } from '../../../lib/session'
import OwnerNav from './OwnerNav'

export default function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { ownerId: string }
}) {
  const owner = currentOwner()

  // Not logged in -> send to the login screen.
  if (!owner) redirect('/owner/login')

  // Logged in as someone else -> bounce to your own dashboard.
  if (owner.id !== params.ownerId) redirect(`/owner/${owner.id}`)

  return (
    <div>
      <OwnerNav ownerId={owner.id} account={owner.email ?? null} />
      {children}
    </div>
  )
}
