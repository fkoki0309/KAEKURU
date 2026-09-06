import { NextResponse } from 'next/server'
import * as mockDb from '../../../../lib/mockDb'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '../../../../lib/session'

const DEMO_OWNER_ID = 'owner-demo'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'メールとパスワードを入力してください' }, { status: 400 })
    }

    let owner: { id: string; email?: string }

    // Mock shortcut: `test` / `test` always signs in as a stable demo owner.
    if (email === 'test' && password === 'test') {
      owner = mockDb.createOwnerAccount({ id: DEMO_OWNER_ID, email: 'test', password: 'test' }).owner
    } else {
      const v = mockDb.verifyOwnerCredentials(email, password)
      if (v.status === 404) return NextResponse.json({ ok: false, error: 'アカウントが見つかりません' }, { status: 404 })
      if (v.status !== 200 || !v.owner) return NextResponse.json({ ok: false, error: 'パスワードが違います' }, { status: 401 })
      owner = v.owner
    }

    const { token } = mockDb.createSession(owner.id)
    const res = NextResponse.json({
      ok: true,
      owner: { id: owner.id, email: owner.email ?? null },
    })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, error: 'サーバーエラー' }, { status: 500 })
  }
}
