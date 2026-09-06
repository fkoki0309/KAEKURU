import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import * as mockDb from '../../../../lib/mockDb'

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const token = params.token
  try {
    // If no DATABASE_URL, use mock
    if (!process.env.DATABASE_URL) {
      const tag = mockDb.getTagByToken(token)
      if (!tag) return NextResponse.json({ error: 'not found' }, { status: 404 })
      if (tag.status === 'unactivated') return NextResponse.json({ status: 'unactivated' })
      const owner = mockDb.getOwnerByTagId(tag.id)
      return NextResponse.json({ status: 'active', tagId: tag.id, owner_id: owner?.id ?? null, item_name: owner?.item_name ?? null })
    }

    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized. Run `npx prisma generate`.' }, { status: 500 })

    const tag = await prisma.tags.findUnique({ where: { token } })
    if (!tag) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (tag.status === 'unactivated') return NextResponse.json({ status: 'unactivated' })

    // active
    // Optionally fetch the current owner
    const owner = await prisma.tag_owners.findFirst({ where: { tag_id: tag.id, unlinked_at: null } })
    return NextResponse.json({ status: 'active', tagId: tag.id, owner_id: owner?.id ?? null, item_name: owner?.item_name ?? null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
