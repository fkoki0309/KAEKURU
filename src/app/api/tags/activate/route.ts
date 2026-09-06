import { NextResponse } from 'next/server'
// NOTE: This is a sample implementation. Adapt to your auth and DB setup.
import { prisma } from '../../../../lib/prisma' // assume prisma client is exposed
import * as mockDb from '../../../../lib/mockDb'
import { currentOwner } from '../../../../lib/session'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, item_name, item_photo_url } = body

    // TODO: validate authentication (e.g. Supabase JWT) and get userId
    let userId = request.headers.get('x-sample-user-id') || null
    // In mock/dev mode, allow missing header and synthesize a mock user
    if (!userId && !process.env.DATABASE_URL) {
      userId = 'mock-user'
    }
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    // If DATABASE_URL is not set, use in-memory mock DB for local dev
    if (!process.env.DATABASE_URL) {
      const res = mockDb.activateTag(token, userId, item_name, currentOwner()?.id ?? null, item_photo_url ?? null)
      if (res.status === 404) return NextResponse.json({ error: 'このトークンのタグが見つかりません' }, { status: 404 })
      if (res.status === 409) {
        const msg =
          res.reason === 'owner_has_item'
            ? '現在は1アカウントにつき1つの持ち物のみ登録できます'
            : 'このタグはすでに登録済みです'
        return NextResponse.json({ error: msg }, { status: 409 })
      }
      return NextResponse.json({ ok: true, tag: res.tag, owner: res.owner })
    }

    // If DATABASE_URL is set but Prisma client failed to initialize, return error
    if (!prisma) {
      return NextResponse.json({ error: 'Prisma client not initialized. Run `npx prisma generate`.' }, { status: 500 })
    }

    // Transaction: check tag status and create owner relation atomically
    const result = await prisma.$transaction(async (tx: any) => {
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
