import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as mockDb from '../../../../lib/mockDb'

const SESSION_COOKIE = 'kaekuru_session'

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const owner = mockDb.getOwnerBySession(token)
  if (!owner) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({
    ok: true,
    owner: { id: owner.id, email: owner.email ?? null, item_name: owner.item_name ?? null },
  })
}
