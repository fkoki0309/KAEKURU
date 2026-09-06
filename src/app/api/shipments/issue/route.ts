import { NextResponse } from 'next/server'
import * as mockDb from '../../../../lib/mockDb'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { token } = body
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    if (!process.env.DATABASE_URL) {
      const tag = mockDb.getTagByToken(token)
      if (!tag) return NextResponse.json({ error: 'not found' }, { status: 404 })
      const owner = mockDb.getOwnerByTagId(tag.id)
      const pickupPoints = owner ? mockDb.listOwnerPickupPoints(owner.id) : []
      const first = (pickupPoints || [])[0] ?? null
      const shipmentId = `label-${Date.now()}`
      return NextResponse.json({ ok: true, shipment_id: shipmentId, pickup_point_id: first?.id ?? null, message: 'mock shipping label issued' })
    }

    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
