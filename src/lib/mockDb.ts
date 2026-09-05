// Simple in-memory mock DB for local UI development when DATABASE_URL is not set.
type Tag = { id: string; token: string; status: 'unactivated' | 'active' }
type Owner = { id: string; tag_id: string; item_name?: string }

const tags = new Map<string, Tag>()
const owners = new Map<string, Owner>()
const returnCases = new Map<string, any>()
const pickupPoints = new Map<string, any>()

export function seedTag(token: string, status: Tag['status'] = 'unactivated') {
  const id = `mock-${Math.random().toString(36).slice(2, 10)}`
  const t: Tag = { id, token, status }
  tags.set(token, t)
  return t
}

export function getTagByToken(token: string) {
  return tags.get(token) ?? null
}

export function activateTag(token: string, userId: string, item_name?: string) {
  const t = tags.get(token)
  if (!t) return { status: 404 }
  if (t.status !== 'unactivated') return { status: 409 }
  t.status = 'active'
  const ownerId = `owner-${Math.random().toString(36).slice(2, 10)}`
  const o: Owner = { id: ownerId, tag_id: t.id, item_name }
  owners.set(ownerId, o)
  return { status: 200, tag: t, owner: o }
}

export function getOwnerByTagId(tagId: string) {
  for (const o of owners.values()) if (o.tag_id === tagId) return o
  return null
}

export function createReturnCase({ token, method, dropoff_location, finder_photo_url, finder_memo, found_location, finder_user_id }: any) {
  const tag = tags.get(token)
  if (!tag) return { status: 404 }
  const id = `rc-${Math.random().toString(36).slice(2, 10)}`
  const case_code = `FND-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const rc = {
    id,
    tag_id: tag.id,
    method,
    dropoff_location: dropoff_location ?? null,
    pickup_point_id: null,
    case_code,
    finder_photo_url: finder_photo_url ?? null,
    finder_memo: finder_memo ?? null,
    found_location: found_location ?? null,
    finder_user_id: finder_user_id ?? null,
    status: 'submitted',
    shipped_at: null,
    received_at: null,
    expires_at: null,
    created_at: new Date().toISOString(),
  }
  returnCases.set(id, rc)
  return { status: 200, return_case: rc }
}

export function createPickupPoint({ return_case_id, days_valid = 14 }: { return_case_id: string; days_valid?: number }) {
  const rc = returnCases.get(return_case_id)
  if (!rc) return { status: 404 }
  const id = `pp-${Math.random().toString(36).slice(2, 10)}`
  const code = `KP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const expires_at = new Date(Date.now() + (days_valid || 14) * 24 * 60 * 60 * 1000).toISOString()
  const pp = { id, return_case_id, code, expires_at, created_at: new Date().toISOString() }
  pickupPoints.set(id, pp)
  // link to return case
  rc.pickup_point_id = id
  return { status: 200, pickup_point: pp }
}

export function getPickupPointById(id: string) {
  return pickupPoints.get(id) ?? null
}

export function getReturnCaseById(id: string) {
  return returnCases.get(id) ?? null
}

// seed a demo tag on module load for convenience
if (!process.env.DATABASE_URL) {
  seedTag('demo-token-123', 'unactivated')
  seedTag('demo-token-activated', 'active')
}
