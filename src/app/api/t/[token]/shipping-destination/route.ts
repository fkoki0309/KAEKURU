import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import * as mockDb from '../../../../../lib/mockDb'

// Public, finder-facing: the anonymous 局留め destination for a token.
// Returns only 局名・住所・受取人名（+ carrier）— never ids, phone, or owner info.
export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const { token } = params
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: true, destination: mockDb.getShippingDestinationForToken(token) })
    }

    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized.' }, { status: 500 })

    const tag = await prisma.tags.findUnique({ where: { token } })
    if (!tag || tag.status !== 'active') return NextResponse.json({ ok: true, destination: null })

    const owner = await prisma.tag_owners.findFirst({ where: { tag_id: tag.id, unlinked_at: null } })
    const pp = owner
      ? await prisma.owner_pickup_points.findFirst({
          where: { user_id: owner.user_id },
          orderBy: { created_at: 'desc' },
        })
      : null

    return NextResponse.json({
      ok: true,
      destination: pp
        ? {
            carrier: pp.carrier,
            address_label: pp.facility_name ? `${pp.facility_name} 留め` : null,
            facility_name: pp.facility_name,
            facility_address: pp.facility_address,
            recipient_name: pp.recipient_name,
          }
        : null,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
