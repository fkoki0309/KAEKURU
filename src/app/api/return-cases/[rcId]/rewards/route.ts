import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request, { params }: { params: { rcId: string } }) {
  try {
    const { rcId } = params
    const body = await request.json()
    const amount = body?.amount ?? 1000
    if (!rcId) return NextResponse.json({ error: 'rcId required' }, { status: 400 })
    if (!process.env.DATABASE_URL) {
      const res = mockDb.createRewardForReturnCase(rcId, amount)
      if (res.status === 404) return NextResponse.json({ error: 'not found' }, { status: 404 })
      return NextResponse.json({ ok: true, reward: res.reward })
    }
    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized.' }, { status: 500 })
    // Real DB flow omitted for brevity
    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
