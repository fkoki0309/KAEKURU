"use client"
import { useEffect, useState } from 'react'

/**
 * The logged-in owner's id from `GET /api/auth/me`.
 * `undefined` = still checking, `null` = not logged in, `string` = owner id.
 */
export function useCurrentOwnerId(): string | null | undefined {
  const [id, setId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !cancelled && setId(j?.owner?.id ?? null))
      .catch(() => !cancelled && setId(null))
    return () => {
      cancelled = true
    }
  }, [])

  return id
}
