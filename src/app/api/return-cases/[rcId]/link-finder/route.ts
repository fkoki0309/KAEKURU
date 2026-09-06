import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request, { params }: { params: { rcId: string } }) {
  try {
    const { rcId } = params
    if (!rcId) return NextResponse.json({ error: 'rcId required' }, { status: 400 })
    const body = await request.json()
    const finder = { name: body?.name, email: body?.email, phone: body?.phone, finder_user_id: body?.finder_user_id }

    if (!process.env.DATABASE_URL) {
      const res = mockDb.linkFinderToReturnCase(rcId, finder)
      if (res.status === 404) return NextResponse.json({ error: 'not found' }, { status: 404 })
      if (res.status === 409) return NextResponse.json({ error: 'already linked', return_case: res.return_case }, { status: 409 })
      return NextResponse.json({ ok: true, return_case: res.return_case, reward: (res as { reward?: unknown }).reward ?? null })
    }

    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized.' }, { status: 500 })
    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
