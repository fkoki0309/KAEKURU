import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request, { params }: { params: { rewardId: string } }) {
  try {
    const { rewardId } = params
    if (!rewardId) return NextResponse.json({ error: 'rewardId required' }, { status: 400 })
    if (!process.env.DATABASE_URL) {
      const res = mockDb.markRewardPaid(rewardId)
      if (res.status === 404) return NextResponse.json({ error: 'not found' }, { status: 404 })
      return NextResponse.json({ ok: true, reward: res.reward })
    }
    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized.' }, { status: 500 })
    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
