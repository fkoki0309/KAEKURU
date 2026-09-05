// Simple in-memory mock DB for local UI development when DATABASE_URL is not set.
import fs from 'fs'
import path from 'path'

type Tag = { id: string; token: string; status: 'unactivated' | 'active' }
type Owner = { id: string; tag_id: string; item_name?: string }

// Safety: in production we must not use the mock DB. Fail fast if this module
// is accidentally imported in a production environment without a real DB.
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('mockDb must not be used in production — set DATABASE_URL and use the real DB')
}

const _GLOBAL_MOCK_KEY = '__kaekuru_mock_db__'
const _globalStore: any = (globalThis as any)[_GLOBAL_MOCK_KEY] || ((globalThis as any)[_GLOBAL_MOCK_KEY] = {
  tags: new Map<string, Tag>(),
  owners: new Map<string, Owner>(),
  returnCases: new Map<string, any>(),
  pickupPoints: new Map<string, any>(),
  notifications: new Map<string, any[]>(),
  tokenToOwner: new Map<string, string>(),
})

const tags: Map<string, Tag> = _globalStore.tags
const owners: Map<string, Owner> = _globalStore.owners
const returnCases: Map<string, any> = _globalStore.returnCases
const pickupPoints: Map<string, any> = _globalStore.pickupPoints
const notifications: Map<string, any[]> = _globalStore.notifications

// Persist mock state to a tmp JSON file so separate Next.js route modules
// (dev mode) can share state reliably.
const MOCK_DB_FILE = path.join(process.cwd(), 'tmp', 'mockDb.json')

function loadMockFile() {
  try {
    if (!fs.existsSync(MOCK_DB_FILE)) return
    const raw = fs.readFileSync(MOCK_DB_FILE, 'utf8')
    const data = JSON.parse(raw)
    // clear existing maps
    tags.clear()
    owners.clear()
    returnCases.clear()
    pickupPoints.clear()
    notifications.clear()
    _globalStore.tokenToOwner = new Map<string, string>()

    for (const t of data.tags || []) tags.set(t.token, t)
    for (const o of data.owners || []) owners.set(o.id, o)
    for (const rc of data.returnCases || []) returnCases.set(rc.id, rc)
    for (const pp of data.pickupPoints || []) pickupPoints.set(pp.id, pp)
    for (const [ownerId, arr] of (data.notifications || [])) notifications.set(ownerId, arr)
    for (const [tok, ownerId] of (data.tokenToOwner || [])) _globalStore.tokenToOwner.set(tok, ownerId)
  } catch (e) {
    console.warn('mockDb: failed to load mock file', e)
  }
}

function saveMockFile() {
  try {
    fs.mkdirSync(path.dirname(MOCK_DB_FILE), { recursive: true })
    const payload = {
      tags: Array.from(tags.values()),
      owners: Array.from(owners.values()),
      returnCases: Array.from(returnCases.values()),
      pickupPoints: Array.from(pickupPoints.values()),
      notifications: Array.from(notifications.entries()),
      tokenToOwner: Array.from((_globalStore.tokenToOwner || new Map()).entries()),
    }
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(payload, null, 2), 'utf8')
  } catch (e) {
    console.warn('mockDb: failed to save mock file', e)
  }
}

// load on module init when running in mock mode
if (!process.env.DATABASE_URL) loadMockFile()

export function seedTag(token: string, status: Tag['status'] = 'unactivated') {
  const id = `mock-${Math.random().toString(36).slice(2, 10)}`
  const t: Tag = { id, token, status }
  tags.set(token, t)
  saveMockFile()
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
  // map token -> owner for cross-instance lookup
  _globalStore.tokenToOwner.set(token, ownerId)
  saveMockFile()
  return { status: 200, tag: t, owner: o }
}

export function getOwnerByTagId(tagId: string) {
  for (const o of owners.values()) if (o.tag_id === tagId) return o
  return null
}

export function getOwnerByToken(token: string) {
  const ownerId = _globalStore.tokenToOwner.get(token)
  if (!ownerId) return null
  return owners.get(ownerId) ?? null
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

  // create notification for owner if exists
  let owner = getOwnerByToken(token) ?? getOwnerByTagId(tag.id)
  // fallback: try matching by scanning owners -> tag token, in case of cross-instance inconsistencies
  if (!owner) {
    for (const o of owners.values()) {
      const tmatch = Array.from(tags.values()).find((tt) => tt.id === o.tag_id && tt.token === token)
      if (tmatch) {
        owner = o
        break
      }
    }
  }
  if (owner) {
    const note = {
      id: `nt-${Math.random().toString(36).slice(2,10)}`,
      owner_id: owner.id,
      return_case_id: id,
      message: `Your item (${owner.item_name ?? '不明'}) was reported found (case ${case_code}).`,
      read: false,
      created_at: new Date().toISOString(),
    }
    const arr = notifications.get(owner.id) ?? []
    arr.unshift(note)
    notifications.set(owner.id, arr)
    saveMockFile()
  }
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
  saveMockFile()
  return { status: 200, pickup_point: pp }
}

// Owner-managed pickup point (pre-registered by owner for局留め等)
export function createOwnerPickupPoint({ owner_id, carrier, facility_name, facility_address, recipient_name }: any) {
  if (!owners.has(owner_id)) return { status: 404 }
  const id = `opp-${Math.random().toString(36).slice(2, 10)}`
  const pp = { id, owner_id, carrier, facility_name, facility_address, recipient_name, created_at: new Date().toISOString() }
  // store in pickupPoints map
  pickupPoints.set(id, pp)
  saveMockFile()
  return { status: 200, pickup_point: pp }
}

export function listOwnerPickupPoints(ownerId: string) {
  const out: any[] = []
  for (const pp of pickupPoints.values()) {
    if ((pp as any).owner_id === ownerId) out.push(pp)
  }
  return out
}

export function getPickupPointById(id: string) {
  return pickupPoints.get(id) ?? null
}

// Helper list functions for debug endpoint
export function listTags() {
  return Array.from(tags.values())
}
export function listOwners() {
  return Array.from(owners.values())
}
export function listReturnCases() {
  return Array.from(returnCases.values())
}
export function listPickupPoints() {
  return Array.from(pickupPoints.values())
}
export function listNotifications() {
  const out: any[] = []
  for (const [ownerId, arr] of notifications.entries()) {
    out.push({ ownerId, notifications: arr })
  }
  return out
}

export function getReturnCaseById(id: string) {
  return returnCases.get(id) ?? null
}

export function createNotificationForOwner(ownerId: string, payload: any) {
  const note = { id: `nt-${Math.random().toString(36).slice(2,10)}`, owner_id: ownerId, ...payload, read: false, created_at: new Date().toISOString() }
  const arr = notifications.get(ownerId) ?? []
  arr.unshift(note)
  notifications.set(ownerId, arr)
  saveMockFile()
  return note
}

export function getNotificationsForOwner(ownerId: string) {
  return (notifications.get(ownerId) ?? []).slice()
}

// seed a demo tag on module load for convenience
if (!process.env.DATABASE_URL) {
  seedTag('demo-token-123', 'unactivated')
  seedTag('demo-token-activated', 'active')
}
