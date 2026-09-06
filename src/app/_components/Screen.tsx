import React from 'react'
import BrandMark from './BrandMark'

type Props = {
  /** Heading shown as the page title. */
  title?: React.ReactNode
  /** href for a "← 戻る" link rendered before the title. */
  back?: string
  /** Small muted line under the title. */
  subtitle?: React.ReactNode
  /** Content aligned to the right of the title row (e.g. a primary action). */
  action?: React.ReactNode
  /** Show the KAEKURU logo above the title (finder / standalone screens). */
  brand?: boolean
  /** max-width override for the card. */
  width?: number
  children: React.ReactNode
}

/** The shared `container > card` screen shell used across the app. */
export default function Screen({ title, back, subtitle, action, brand = false, width, children }: Props) {
  return (
    <div className="container card stack" style={width ? { maxWidth: width } : undefined}>
      {brand && <BrandMark height={34} />}

      {(title || back || subtitle || action) && (
        <div className="stack-sm">
          <div className="row-between">
            <div className="row">
              {back && (
                <a href={back} className="button ghost">
                  ← 戻る
                </a>
              )}
              {title && (
                <h1 className="page-title" style={{ margin: 0 }}>
                  {title}
                </h1>
              )}
            </div>
            {action}
          </div>
          {subtitle && <div className="small-muted">{subtitle}</div>}
        </div>
      )}

      {children}
    </div>
  )
}
