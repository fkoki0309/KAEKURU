// Simple in-memory mock DB for local UI development when DATABASE_URL is not set.
import fs from 'fs'
import path from 'path'

type Tag = { id: string; token: string; status: 'unactivated' | 'active' }
type Owner = {
  id: string
  tag_id: string | null
  item_name?: string
  item_photo_url?: string | null
  email?: string
  password?: string
}
type Session = { token: string; owner_id: string; created_at: string }

// Safety: in production we must not use the mock DB. Fail fast if this module
// is accidentally imported in a production environment without a real DB.
// `ALLOW_MOCK_DB=1` opts back in for a production build of the demo.
if (
  process.env.NODE_ENV === 'production' &&
  !process.env.DATABASE_URL &&
  !process.env.ALLOW_MOCK_DB
) {
  throw new Error('mockDb must not be used in production — set DATABASE_URL, or ALLOW_MOCK_DB=1 for a demo build')
}

const _GLOBAL_MOCK_KEY = '__kaekuru_mock_db__'
const _globalStore: any = (globalThis as any)[_GLOBAL_MOCK_KEY] || ((globalThis as any)[_GLOBAL_MOCK_KEY] = {
  tags: new Map<string, Tag>(),
  owners: new Map<string, Owner>(),
  returnCases: new Map<string, any>(),
  pickupPoints: new Map<string, any>(),
  notifications: new Map<string, any[]>(),
  rewards: new Map<string, any>(),
  sessions: new Map<string, Session>(),
  tokenToOwner: new Map<string, string>(),
})

const tags: Map<string, Tag> = _globalStore.tags
const owners: Map<string, Owner> = _globalStore.owners
const returnCases: Map<string, any> = _globalStore.returnCases
const pickupPoints: Map<string, any> = _globalStore.pickupPoints
const notifications: Map<string, any[]> = _globalStore.notifications
const rewards: Map<string, any> = _globalStore.rewards
const sessions: Map<string, Session> = _globalStore.sessions

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
    sessions.clear()
    _globalStore.tokenToOwner = new Map<string, string>()

    for (const t of data.tags || []) tags.set(t.token, t)
    for (const o of data.owners || []) owners.set(o.id, o)
    for (const rc of data.returnCases || []) returnCases.set(rc.id, rc)
    for (const pp of data.pickupPoints || []) pickupPoints.set(pp.id, pp)
    for (const [ownerId, arr] of (data.notifications || [])) notifications.set(ownerId, arr)
    for (const r of (data.rewards || [])) rewards.set(r.id, r)
    for (const s of (data.sessions || [])) sessions.set(s.token, s)
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
      rewards: Array.from(rewards.values()),
      sessions: Array.from(sessions.values()),
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

  export function createRewardForReturnCase(return_case_id: string, amount: number = 1000) {
    const rc = returnCases.get(return_case_id)
    if (!rc) return { status: 404 as const }
    // One reward per return case — return the existing one if any.
    for (const r of rewards.values()) {
      if (r.return_case_id === return_case_id) return { status: 200 as const, reward: r }
    }
    const owner = getOwnerByTagId(rc.tag_id)
    if (!owner) return { status: 404 as const }
    const id = `rw-${Math.random().toString(36).slice(2, 10)}`
    const reward = {
      id,
      return_case_id,
      owner_id: owner.id,
      amount: amount || 0,
      status: 'pending',
      finder_name: rc.finder_info?.name ?? null,
      created_at: new Date().toISOString(),
      paid_at: null,
    }
    rewards.set(id, reward)
    saveMockFile()
    return { status: 200 as const, reward }
  }

  export function markRewardPaid(rewardId: string) {
    const r = rewards.get(rewardId)
    if (!r) return { status: 404 }
    r.status = 'paid'
    r.paid_at = new Date().toISOString()
    rewards.set(rewardId, r)
    saveMockFile()
    return { status: 200, reward: r }
  }

  export function listRewardsForOwner(ownerId: string) {
    const out: any[] = []
    for (const r of rewards.values()) if (r.owner_id === ownerId) out.push(r)
    return out
  }

  export function linkFinderToReturnCase(return_case_id: string, finder: { name?: string, email?: string, phone?: string, finder_user_id?: string }) {
    const rc = returnCases.get(return_case_id)
    if (!rc) return { status: 404 }
    // If already linked, return conflict
    if (rc.finder_user_id) return { status: 409, message: 'already linked', return_case: rc }
    rc.finder_user_id = finder.finder_user_id ?? null
    rc.finder_info = { name: finder.name ?? null, email: finder.email ?? null, phone: finder.phone ?? null }
    returnCases.set(return_case_id, rc)
    // If the owner already confirmed receipt, the reward becomes due now.
    let reward = null
    if (rc.status === 'received') {
      const r = createRewardForReturnCase(return_case_id)
      if (r.status === 200) reward = r.reward
    }
    saveMockFile()
    return { status: 200, return_case: rc, reward }
  }

export function getTagByToken(token: string) {
  return tags.get(token) ?? null
}

export function runExpiryAlerts() {
  const now = Date.now()
  const alerted: any[] = []
  for (const rc of returnCases.values()) {
    if (!rc.expires_at) continue
    const exp = new Date(rc.expires_at).getTime()
    if (exp <= now && !rc.expires_alerted) {
      // mark alerted
      rc.expires_alerted = true
      returnCases.set(rc.id, rc)
      // notify owner
      const owner = getOwnerByTagId(rc.tag_id)
      const msg = {
        id: `nt-${Math.random().toString(36).slice(2,10)}`,
        owner_id: owner?.id ?? null,
        return_case_id: rc.id,
        message: `局留め期限が到来しました（ケース ${rc.case_code || rc.id}）。`,
        read: false,
        created_at: new Date().toISOString(),
      }
      if (owner) {
        const arr = notifications.get(owner.id) ?? []
        arr.unshift(msg)
        notifications.set(owner.id, arr)
      }
      alerted.push({ return_case_id: rc.id, owner_id: owner?.id ?? null })
    }
  }
  saveMockFile()
  return alerted
}

export function activateTag(
  token: string,
  userId: string,
  item_name?: string,
  ownerIdToLink?: string | null,
  item_photo_url?: string | null,
) {
  const t = tags.get(token)
  if (!t) return { status: 404 as const }
  if (t.status !== 'unactivated') return { status: 409 as const, reason: 'tag_activated' as const }

  // Prefer linking to the logged-in owner so the owner can see the resulting
  // notifications in the UI. Fall back to a fresh owner when unauthenticated.
  let o = ownerIdToLink ? owners.get(ownerIdToLink) : undefined
  if (o) {
    // Current mock model is one item per owner. Refuse a second rather than
    // silently overwriting the first (true tag_owners 1:N is a later step).
    if (o.tag_id && o.tag_id !== t.id) {
      return { status: 409 as const, reason: 'owner_has_item' as const }
    }
    o.tag_id = t.id
    if (item_name) o.item_name = item_name
    if (item_photo_url !== undefined) o.item_photo_url = item_photo_url
  } else {
    o = { id: `owner-${Math.random().toString(36).slice(2, 10)}`, tag_id: t.id, item_name, item_photo_url: item_photo_url ?? null }
  }
  t.status = 'active'
  owners.set(o.id, o)
  // map token -> owner for cross-instance lookup
  _globalStore.tokenToOwner.set(token, o.id)
  saveMockFile()
  return { status: 200 as const, tag: t, owner: o }
}

export function getOwnerByTagId(tagId: string) {
  for (const o of owners.values()) if (o.tag_id === tagId) return o
  return null
}

// The logged-in owner's registered belongings. The current mock links one tag
// per owner, so this is 0 or 1 entry; it already has the array shape the
// dashboard and a future tag_owners (1:N) model will use.
export function listItemsForOwner(ownerId: string) {
  const owner = owners.get(ownerId)
  if (!owner || !owner.tag_id) return []
  const tag = Array.from(tags.values()).find((t) => t.id === owner.tag_id)
  const notes = notifications.get(ownerId) ?? []
  const latestCase = Array.from(returnCases.values())
    .filter((rc) => rc.tag_id === owner.tag_id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
  return [
    {
      tag_id: owner.tag_id,
      token: tag?.token ?? null,
      item_name: owner.item_name ?? null,
      item_photo_url: owner.item_photo_url ?? null,
      tag_status: tag?.status ?? 'unactivated',
      unread_notifications: notes.filter((n) => !n.read).length,
      latest_case_status: (latestCase?.status ?? 'none') as string,
    },
  ]
}

export function getOwnerByToken(token: string) {
  const ownerId = _globalStore.tokenToOwner.get(token)
  if (!ownerId) return null
  return owners.get(ownerId) ?? null
}

// What a finder is allowed to see about the anonymous mail destination for a
// token: the pickup point's public fields only (局名・住所・受取人名). Never the
// pickup point id, phone number, or any owner reference.
export function getShippingDestinationForToken(token: string) {
  const tag = tags.get(token)
  if (!tag || tag.status !== 'active') return null
  const owner = getOwnerByToken(token) ?? getOwnerByTagId(tag.id)
  if (!owner) return null
  const pp = listOwnerPickupPoints(owner.id)[0]
  if (!pp) return null
  return {
    carrier: pp.carrier ?? null,
    address_label: pp.facility_name ? `${pp.facility_name} 留め` : null,
    facility_name: pp.facility_name ?? null,
    facility_address: pp.facility_address ?? null,
    recipient_name: pp.recipient_name ?? null,
  }
}

export function createReturnCase({ token, method, dropoff_location, finder_photo_url, finder_memo, found_location, finder_user_id }: any) {
  const tag = tags.get(token)
  if (!tag) return { status: 404 }
  const id = `rc-${Math.random().toString(36).slice(2, 10)}`
  const case_code = `FND-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

  // For mail, the server resolves the owner's registered pickup point — the
  // finder never picks it (and never receives its id).
  let pickup_point_id: string | null = null
  if (method === 'mail') {
    const owner = getOwnerByToken(token) ?? getOwnerByTagId(tag.id)
    pickup_point_id = (owner ? listOwnerPickupPoints(owner.id)[0]?.id : null) ?? null
  }

  const rc = {
    id,
    tag_id: tag.id,
    method,
    dropoff_location: dropoff_location ?? null,
    pickup_point_id,
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
    const itemName = owner.item_name ?? '持ち物'
    const pickupName = pickup_point_id ? getPickupPointById(pickup_point_id)?.facility_name ?? null : null
    const where =
      method === 'mail'
        ? pickupName
          ? `郵送（${pickupName} 留め）`
          : '郵送'
        : dropoff_location
          ? `手渡し（${dropoff_location}）`
          : '手渡し'

    const note = {
      id: `nt-${Math.random().toString(36).slice(2, 10)}`,
      owner_id: owner.id,
      return_case_id: id,
      type: 'found' as const,
      item_name: owner.item_name ?? null,
      case_code,
      method,
      dropoff_location: dropoff_location ?? null,
      pickup_point_name: pickupName,
      finder_memo: finder_memo ?? null,
      finder_photo_url: finder_photo_url ?? null,
      message: `「${itemName}」の落とし物が届け出られました。届け方: ${where}。受付番号 ${case_code}`,
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

export function markReturnCaseReceived(id: string) {
  const rc = returnCases.get(id)
  if (!rc) return { status: 404 as const }
  rc.status = 'received'
  rc.received_at = new Date().toISOString()
  returnCases.set(id, rc)

  // Stage A: a reward is due only if the finder identified themselves
  // (linked name/contact). Anonymous finders get no reward.
  let reward = null
  if (rc.finder_info?.name || rc.finder_info?.email) {
    const r = createRewardForReturnCase(id)
    if (r.status === 200) reward = r.reward
  }
  saveMockFile()
  return { status: 200 as const, return_case: rc, reward }
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

// --- Owner authentication (mock only) ---------------------------------------
// Passwords are stored in plain text here on purpose: this module is a local
// development stand-in and never runs in production (guarded at the top).

export function getOwnerByEmail(email: string) {
  const needle = email.trim().toLowerCase()
  for (const o of owners.values()) {
    if ((o.email ?? '').toLowerCase() === needle) return o
  }
  return null
}

export function createOwnerAccount({ email, password, item_name, id }: { email: string; password: string; item_name?: string; id?: string }) {
  const existing = getOwnerByEmail(email)
  if (existing) return { status: 200 as const, owner: existing }
  const ownerId = id ?? `owner-${Math.random().toString(36).slice(2, 10)}`
  const o: Owner = { id: ownerId, tag_id: null, item_name, email, password }
  owners.set(ownerId, o)
  saveMockFile()
  return { status: 201 as const, owner: o }
}

export function verifyOwnerCredentials(email: string, password: string) {
  const o = getOwnerByEmail(email)
  if (!o) return { status: 404 as const, owner: null }
  if (o.password !== password) return { status: 401 as const, owner: null }
  return { status: 200 as const, owner: o }
}

export function createSession(ownerId: string) {
  const token = `sess-${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`
  const s: Session = { token, owner_id: ownerId, created_at: new Date().toISOString() }
  sessions.set(token, s)
  saveMockFile()
  return { token, session: s }
}

export function getOwnerBySession(token: string | null | undefined) {
  if (!token) return null
  const s = sessions.get(token)
  if (!s) return null
  return owners.get(s.owner_id) ?? null
}

export function deleteSession(token: string | null | undefined) {
  if (!token) return
  if (sessions.delete(token)) saveMockFile()
}

// Seed the demo tags once, only when they are not already present. Seeding
// unconditionally here would overwrite tags every time a route module re-imports
// this file (Next dev), wiping any activation that happened at runtime.
if (!process.env.DATABASE_URL) {
  if (!tags.has('demo-token-123')) seedTag('demo-token-123', 'unactivated')
  if (!tags.has('demo-token-activated')) seedTag('demo-token-activated', 'active')
}
