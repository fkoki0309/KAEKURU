import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request, { params }: { params: { rcId: string } }) {
  try {
    const { rcId } = params
    if (!rcId) return NextResponse.json({ error: 'rcId required' }, { status: 400 })

    if (!process.env.DATABASE_URL) {
      const res = mockDb.markReturnCaseReceived(rcId)
      if (res.status === 404) return NextResponse.json({ error: 'not found' }, { status: 404 })
      return NextResponse.json({ ok: true, return_case: res.return_case })
    }

    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized.' }, { status: 500 })
    const updated = await prisma.return_cases.update({ where: { id: rcId }, data: { status: 'received', received_at: new Date() } })
    return NextResponse.json({ ok: true, return_case: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
