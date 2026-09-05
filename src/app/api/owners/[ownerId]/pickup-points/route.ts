import { NextResponse } from 'next/server'
import * as mockDb from '../../../../../lib/mockDb'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request, { params }: { params: { ownerId: string } }) {
  try {
    const body = await request.json()
    const { ownerId } = params
    const { carrier, facility_name, facility_address, recipient_name } = body

    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 })

    if (!process.env.DATABASE_URL) {
      const res = mockDb.createOwnerPickupPoint({ owner_id: ownerId, carrier, facility_name, facility_address, recipient_name })
      if (res.status === 404) return NextResponse.json({ error: 'owner not found' }, { status: 404 })
      return NextResponse.json({ ok: true, pickup_point: res.pickup_point })
    }

    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized. Run `npx prisma generate`.' }, { status: 500 })

    const created = await prisma.owner_pickup_points.create({
      data: {
        user_id: ownerId,
        carrier: carrier ?? null,
        facility_name: facility_name ?? null,
        facility_address: facility_address ?? null,
        recipient_name: recipient_name ?? null,
      },
    })
    return NextResponse.json({ ok: true, pickup_point: created })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: { ownerId: string } }) {
  try {
    const { ownerId } = params
    if (!ownerId) return NextResponse.json({ error: 'ownerId required' }, { status: 400 })
    if (!process.env.DATABASE_URL) {
      const list = mockDb.listOwnerPickupPoints(ownerId)
      return NextResponse.json({ ok: true, pickup_points: list })
    }
    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized. Run `npx prisma generate`.' }, { status: 500 })
    const rows = await prisma.owner_pickup_points.findMany({ where: { user_id: ownerId } })
    return NextResponse.json({ ok: true, pickup_points: rows })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
