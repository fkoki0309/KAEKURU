import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const token = params.token
  try {
    const tag = await prisma.tags.findUnique({ where: { token } })
    if (!tag) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (tag.status === 'unactivated') return NextResponse.json({ status: 'unactivated' })

    // active
    // Optionally fetch the current owner
    const owner = await prisma.tag_owners.findFirst({ where: { tag_id: tag.id, unlinked_at: null } })
    return NextResponse.json({ status: 'active', tagId: tag.id, item_name: owner?.item_name ?? null })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
