import { NextResponse } from 'next/server'
import * as mockDb from '../../../../lib/mockDb'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { return_case_id, days_valid } = body
    if (!return_case_id) return NextResponse.json({ error: 'return_case_id required' }, { status: 400 })

    // Mock mode
    if (!process.env.DATABASE_URL) {
      const res = mockDb.createPickupPoint({ return_case_id, days_valid })
      if (res.status === 404) return NextResponse.json({ error: 'return_case not found' }, { status: 404 })
      return NextResponse.json({ ok: true, pickup_point: res.pickup_point })
    }

    // Production DB path not implemented in this PR
    return NextResponse.json({ error: 'Not implemented for real DB yet' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
