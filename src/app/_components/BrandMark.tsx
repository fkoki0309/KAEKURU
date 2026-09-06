import React from 'react'
import Link from 'next/link'

/** The KAEKURU wordmark as a clickable logo; links to the home page. */
export default function BrandMark({ height = 36 }: { height?: number }) {
  return (
    <Link
      href="/"
      aria-label="KAEKURU — ホーム"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flex: '0 0 auto',
        height,
        fontSize: Math.max(12, Math.round(height * 0.42)),
        fontWeight: 600,
        letterSpacing: '0.2em',
        color: 'var(--heading)',
        textDecoration: 'none',
        lineHeight: 1,
      }}
    >
      KAEKURU
    </Link>
  )
}
