"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Screen from '../../_components/Screen'
import TagStatusCard from '../../_components/TagStatusCard'
import { useCurrentOwnerId } from '../../_hooks/useCurrentOwnerId'
import { useTag } from './useTag'

type FoundPlace = null | 'facility' | 'outdoor'

export default function TokenPage() {
  const params = useParams() as { token?: string }
  const token = params?.token
  const tag = useTag(token)
  const ownerId = useCurrentOwnerId()
  const [place, setPlace] = useState<FoundPlace>(null)

  if (!token) return <Screen brand title="QRタグ">トークンが指定されていません</Screen>

  const registerHref = ownerId
    ? `/owner/${ownerId}/items/new?token=${encodeURIComponent(token)}`
    : `/owner/login?token=${encodeURIComponent(token)}`

  return (
    <Screen brand title={`QRタグ: ${token}`}>
      {tag.status === 'loading' && <p className="muted">読み込み中…</p>}

      {tag.status === 'unactivated' && (
        <div className="stack">
          <TagStatusCard status="unactivated" />
          <p className="small-muted" style={{ margin: 0 }}>
            {ownerId
              ? 'この持ち物の持ち主なら、そのまま登録できます。読み取ったトークンは登録画面に引き継がれます。'
              : 'この持ち物の持ち主の方はログインして登録してください。読み取ったトークンは登録画面に引き継がれます。'}
          </p>
          <div className="row">
            <Link href={registerHref} className="button primary lg">
              {ownerId ? 'この持ち物を登録する' : '持ち主としてログインして登録'}
            </Link>
          </div>
        </div>
      )}

      {tag.status === 'active' && (
        <div className="stack">
          <TagStatusCard status="active" itemName={tag.itemName} />

          {place === null && (
            <div className="panel stack-sm">
              <strong className="section-title" style={{ margin: 0 }}>
                この持ち物をどこで拾いましたか？
              </strong>
              <p className="small-muted" style={{ margin: 0 }}>
                拾った場所によって、法律上のお届け先が変わります。
              </p>
              <div className="stack-sm">
                <button type="button" className="button block" onClick={() => setPlace('facility')}>
                  駅・お店・商業施設など、係員がいる場所
                </button>
                <button type="button" className="button block" onClick={() => setPlace('outdoor')}>
                  路上・公園など、係員がいない場所
                </button>
              </div>
            </div>
          )}

          {place === 'facility' && (
            <div className="panel stack-sm">
              <strong className="section-title" style={{ margin: 0 }}>
                施設の遺失物窓口へお渡しください
              </strong>
              <p className="small-muted" style={{ margin: 0 }}>
                駅・お店・商業施設などで拾った落とし物は、法律上その施設の係員に渡すことになっています（遺失物法4条2項、24時間以内）。施設の窓口で、この持ち物と拾った状況をお伝えください。窓口を通じて持ち主に連絡が届きます。
              </p>
              <p className="small-muted" style={{ margin: 0 }}>
                施設に遺失物の窓口がない場合は、お近くの交番・警察署にお届けください。
              </p>
              <div className="row">
                <button type="button" className="button ghost" onClick={() => setPlace(null)}>
                  ← 選び直す
                </button>
              </div>
            </div>
          )}

          {place === 'outdoor' && (
            <div className="stack">
              <p className="small-muted" style={{ margin: 0 }}>
                この持ち物を拾った方は、次の画面から届け出を行ってください。拾得から1週間以内に発送・お渡しをお願いします。
              </p>
              <div className="row">
                <Link href={`/t/${token}/report`} className="button primary lg">
                  届け出る
                </Link>
                <button type="button" className="button ghost" onClick={() => setPlace(null)}>
                  ← 選び直す
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tag.status === 'error' && (
        <div className="panel stack-sm">
          <strong>エラー</strong>
          <p className="small-muted" style={{ margin: 0 }}>{tag.message}</p>
        </div>
      )}
    </Screen>
  )
}
