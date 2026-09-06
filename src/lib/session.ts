import { cookies } from 'next/headers'
import { getOwnerBySession } from './mockDb'

export const SESSION_COOKIE = 'kaekuru_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** The owner for the current request's session cookie, or null. */
export function currentOwner() {
  return getOwnerBySession(cookies().get(SESSION_COOKIE)?.value)
}
