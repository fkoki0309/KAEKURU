import React from 'react'
import Link from 'next/link'

/** The KAEKURU illustration as a clickable logo; links to the home page. */
export default function BrandMark({ height = 36 }: { height?: number }) {
  return (
    <Link href="/" aria-label="KAEKURU — ホーム" style={{ display: 'inline-flex', flex: '0 0 auto' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="KAEKURU" style={{ height, width: 'auto', display: 'block' }} />
    </Link>
  )
}
