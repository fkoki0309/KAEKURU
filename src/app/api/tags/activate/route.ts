import { NextResponse } from 'next/server'
// NOTE: This is a sample implementation. Adapt to your auth and DB setup.
import { prisma } from '@/lib/prisma' // assume prisma client is exposed
import * as mockDb from '@/lib/mockDb'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, item_name, item_photo_url } = body

    // TODO: validate authentication (e.g. Supabase JWT) and get userId
    const userId = (request.headers.get('x-sample-user-id') || null)
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    // If DATABASE_URL is not set, use in-memory mock DB for local dev
    if (!process.env.DATABASE_URL) {
      const res = mockDb.activateTag(token, userId, item_name)
      if (res.status === 404) return NextResponse.json({ error: 'not found' }, { status: 404 })
      if (res.status === 409) return NextResponse.json({ error: 'already activated' }, { status: 409 })
      return NextResponse.json({ ok: true, tag: res.tag, owner: res.owner })
    }

    // Transaction: check tag status and create owner relation atomically
    const result = await prisma.$transaction(async (tx) => {
      const tag = await tx.tags.findUnique({ where: { token } })
      if (!tag) return { status: 404 }
      if (tag.status !== 'unactivated') return { status: 409 }

      const updated = await tx.tags.update({ where: { id: tag.id }, data: { status: 'active' } })
      const owner = await tx.tag_owners.create({
        data: {
          tag_id: tag.id,
          user_id: userId,
          item_name: item_name ?? null,
          item_photo_url: item_photo_url ?? null,
          activated_at: new Date(),
        },
      })
      return { status: 200, tag: updated, owner }
    })

    if (result.status === 404) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (result.status === 409) return NextResponse.json({ error: 'already activated' }, { status: 409 })

    return NextResponse.json({ ok: true, tag: result.tag, owner: result.owner })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
