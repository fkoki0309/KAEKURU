import { NextResponse } from 'next/server'
import * as mockDb from '../../../lib/mockDb'
import { prisma } from '../../../lib/prisma'
import fs from 'fs/promises'
import path from 'path'

async function saveBase64ToUploads(data: string) {
  const match = data.match(/^data:(image\/[^;]+);base64,(.+)$/)
  let ext = 'bin'
  let b64 = data
  if (match) {
    const mime = match[1]
    b64 = match[2]
    ext = mime.split('/')[1]
  }
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(uploadsDir, { recursive: true })
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`
  const filePath = path.join(uploadsDir, fileName)
  const buf = Buffer.from(b64, 'base64')
  await fs.writeFile(filePath, buf)
  return `/uploads/${fileName}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, method, dropoff_location, finder_photo_url, finder_photo, finder_memo, found_location, finder_user_id } = body

    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

    // If finder_photo (base64 or data URL) is provided, save it and set finder_photo_url
    let photoUrl = finder_photo_url
    if (!photoUrl && finder_photo) {
      try {
        photoUrl = await saveBase64ToUploads(finder_photo)
      } catch (e) {
        console.error('failed to save photo', e)
      }
    }

    // Mock mode
    if (!process.env.DATABASE_URL) {
      const res = mockDb.createReturnCase({ token, method, dropoff_location, finder_photo_url: photoUrl, finder_memo, found_location, finder_user_id })
      if (res.status === 404) return NextResponse.json({ error: 'tag not found' }, { status: 404 })
      return NextResponse.json({ ok: true, return_case: res.return_case })
    }

    if (!prisma) return NextResponse.json({ error: 'Prisma client not initialized. Run `npx prisma generate`.' }, { status: 500 })

    // Real DB path
    const tag = await prisma.tags.findUnique({ where: { token } })
    if (!tag) return NextResponse.json({ error: 'tag not found' }, { status: 404 })
    const rc = await prisma.return_cases.create({
      data: {
        tag_id: tag.id,
        method,
        dropoff_location: dropoff_location ?? null,
        finder_photo_url: photoUrl ?? null,
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
