"use client"
import { useEffect, useState } from 'react'

export type TagState =
  | { status: 'loading' }
  | { status: 'unactivated' }
  | { status: 'active'; itemName: string | null }
  | { status: 'error'; message: string }

/** Fetches GET /api/t/:token and maps it to a discriminated TagState. */
export function useTag(token: string | undefined): TagState {
  const [state, setState] = useState<TagState>({ status: 'loading' })

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setState({ status: 'loading' })

    fetch(`/api/t/${token}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setState({
            status: 'error',
            message: res.status === 404 ? 'タグが見つかりません' : body.error || '不明なエラー',
          })
          return
        }
        if (body.status === 'unactivated') setState({ status: 'unactivated' })
        else if (body.status === 'active') setState({ status: 'active', itemName: body.item_name ?? null })
        else setState({ status: 'error', message: '不明なステータス' })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', message: 'ネットワークエラー' })
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return state
}
