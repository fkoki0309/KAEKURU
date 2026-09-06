import { NextResponse } from 'next/server'
import * as mockDb from '../../../lib/mockDb'
import { prisma } from '../../../lib/prisma'

// The finder uploads any photo via POST /api/uploads first and sends the
// resulting finder_photo_url here.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, method, dropoff_location, finder_photo_url, finder_memo, found_location, finder_user_id } = body

    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    // Mock mode
    if (!process.env.DATABASE_URL) {
      const res = mockDb.createReturnCase({
        token,
        method,
        dropoff_location,
        finder_photo_url,
        finder_memo,
        found_location,
        finder_user_id,
      })
      if (res.status === 404) return NextResponse.json({ error: 'tag not found' }, { status: 404 })
      return NextResponse.json({ ok: true, return_case: res.return_case })
    }

    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized. Run `npx prisma generate`.' }, { status: 500 })

    // Real DB path
    const tag = await prisma.tags.findUnique({ where: { token } })
    if (!tag) return NextResponse.json({ error: 'tag not found' }, { status: 404 })

    // For mail, resolve the owner's pickup point on the server — never trust a
    // client-supplied pickup_point_id.
    let pickup_point_id: string | null = null
    if (method === 'mail') {
      const owner = await prisma.tag_owners.findFirst({ where: { tag_id: tag.id, unlinked_at: null } })
      const pp = owner
        ? await prisma.owner_pickup_points.findFirst({
            where: { user_id: owner.user_id },
            orderBy: { created_at: 'desc' },
          })
        : null
      pickup_point_id = pp?.id ?? null
    }

    const rc = await prisma.return_cases.create({
      data: {
        tag_id: tag.id,
        method,
        dropoff_location: dropoff_location ?? null,
        pickup_point_id,
        finder_photo_url: finder_photo_url ?? null,
        finder_memo: finder_memo ?? null,
        found_location: found_location ?? null,
        finder_user_id: finder_user_id ?? null,
        case_code: `FND-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      },
    })
    return NextResponse.json({ ok: true, return_case: rc })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
