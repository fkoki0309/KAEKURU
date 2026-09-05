// Simple in-memory mock DB for local UI development when DATABASE_URL is not set.
type Tag = { id: string; token: string; status: 'unactivated' | 'active' }
type Owner = { id: string; tag_id: string; item_name?: string }

const tags = new Map<string, Tag>()
const owners = new Map<string, Owner>()

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

// seed a demo tag on module load for convenience
if (!process.env.DATABASE_URL) {
  seedTag('demo-token-123', 'unactivated')
  seedTag('demo-token-activated', 'active')
}
