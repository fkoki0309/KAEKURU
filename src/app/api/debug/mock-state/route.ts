import { NextResponse } from 'next/server'
import * as mockDb from '../../../../lib/mockDb'

export async function GET() {
  try {
    // Expose internal mock structures for debugging (only in dev/mock mode)
    if (process.env.DATABASE_URL) return NextResponse.json({ error: 'Not available in real DB mode' }, { status: 404 })

    // Convert Maps to plain objects/arrays
    // Note: mockDb does not export the maps directly, so we add helper getters if needed.
    const state = {
      tags: (mockDb as any).listTags ? (mockDb as any).listTags() : null,
      owners: (mockDb as any).listOwners ? (mockDb as any).listOwners() : null,
      returnCases: (mockDb as any).listReturnCases ? (mockDb as any).listReturnCases() : null,
      pickupPoints: (mockDb as any).listPickupPoints ? (mockDb as any).listPickupPoints() : null,
      notifications: (mockDb as any).listNotifications ? (mockDb as any).listNotifications() : null,
    }

    return NextResponse.json({ ok: true, state })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}
