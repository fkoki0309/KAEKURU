import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      const res = mockDb.runExpiryAlerts()
      return NextResponse.json({ ok: true, alerted: res })
    }
    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
