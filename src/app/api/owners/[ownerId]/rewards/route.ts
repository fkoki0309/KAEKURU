import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'
import { prisma } from '../../../../../lib/prisma'

export async function GET(request: Request, { params }: { params: { ownerId: string } }) {
  try {
    const { ownerId } = params
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 })
    if (!process.env.DATABASE_URL) {
      const list = mockDb.listRewardsForOwner(ownerId)
      return NextResponse.json({ ok: true, rewards: list })
    }
    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized.' }, { status: 500 })
    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
