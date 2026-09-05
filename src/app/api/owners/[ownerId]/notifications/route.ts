import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'

export async function GET(request: Request, { params }: { params: { ownerId: string } }) {
  try {
    const { ownerId } = params
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 })

    if (!process.env.DATABASE_URL) {
      const notes = mockDb.getNotificationsForOwner(ownerId)
      return NextResponse.json({ ok: true, notifications: notes })
    }

    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
