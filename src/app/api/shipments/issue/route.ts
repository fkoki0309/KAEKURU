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
      // persist shipment in mock DB
      const created = mockDb.createShipment({ token, pickup_point_id: first?.id ?? null })
      if (created.status !== 200) return NextResponse.json({ error: 'failed to create shipment' }, { status: 500 })
      return NextResponse.json({ ok: true, shipment_id: created.shipment.shipment_id, pickup_point_id: created.shipment.pickup_point_id ?? null, message: 'mock shipping label issued' })
    }

    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
