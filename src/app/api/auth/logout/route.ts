import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as mockDb from '../../../../lib/mockDb'

const SESSION_COOKIE = 'kaekuru_session'

export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value
  mockDb.deleteSession(token)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
