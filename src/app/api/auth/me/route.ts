import { NextResponse } from 'next/server'
import { currentOwner } from '../../../../lib/session'

export async function GET() {
  const owner = currentOwner()
  if (!owner) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({
    ok: true,
    owner: { id: owner.id, email: owner.email ?? null, item_name: owner.item_name ?? null },
  })
}
