import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

type Body = { filename?: string; data: string }

export async function POST(request: Request) {
  try {
    const body: Body = await request.json()
    const { data } = body
    if (!data) return NextResponse.json({ error: 'data required' }, { status: 400 })

    // data may be a data URL: data:image/png;base64,....
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

    const url = `/uploads/${fileName}`
    return NextResponse.json({ ok: true, url })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
