import { NextResponse } from 'next/server'
import * as mockDb from '../../../lib/mockDb'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    const ownerId = url.searchParams.get('owner_id')
    if (!process.env.DATABASE_URL) {
      if (token) {
        const list = mockDb.listShipmentsForToken(token)
        return NextResponse.json({ ok: true, shipments: list })
      }
      if (ownerId) {
        const list = mockDb.listShipmentsForOwner(ownerId)
        return NextResponse.json({ ok: true, shipments: list })
      }
      // return all shipments
      return NextResponse.json({ ok: true, shipments: mockDb.listShipmentsForOwner ? mockDb.listShipmentsForOwner('') : [] })
    }
    return NextResponse.json({ error: 'Not implemented for real DB' }, { status: 501 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
