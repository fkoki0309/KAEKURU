import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getOwnerBySession } from '../../../lib/mockDb'
import OwnerNav from './OwnerNav'

const SESSION_COOKIE = 'kaekuru_session'

export default function OwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { ownerId: string }
}) {
  const token = cookies().get(SESSION_COOKIE)?.value
  const owner = getOwnerBySession(token)

  // Not logged in -> send to the login screen.
  if (!owner) redirect('/owner/login')

  // Logged in as someone else -> bounce to your own dashboard.
  if (owner.id !== params.ownerId) redirect(`/owner/${owner.id}`)

  return (
    <div>
      <OwnerNav ownerId={owner.id} itemName={owner.item_name ?? null} />
      {children}
    </div>
  )
}
