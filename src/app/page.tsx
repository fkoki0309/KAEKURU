"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { useCurrentOwnerId } from './_hooks/useCurrentOwnerId'

export default function HomePage() {
  const router = useRouter()
  const ownerId = useCurrentOwnerId()

  const [code, setCode] = useState('')
  function goToTag(e: React.FormEvent) {
    e.preventDefault()
    const t = code.trim()
    if (t) router.push(`/t/${encodeURIComponent(t)}`)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRule} />
      <div className={styles.wrap}>
        <a href="/" className={styles.wordmark}>KAEKURU</a>

        <h1 className={styles.hero}>
          落とし物が、
          <br />
          持ち主のもとへ帰る。
        </h1>

        <p className={styles.lede}>
          QRシールを貼っておくだけ。拾った人は匿名のまま届け出て、
          持ち主は住所や連絡先を明かさずに受け取れます。
        </p>

        <div className={styles.paths}>
          <div className={styles.path}>
            <div className={styles.pathLabel}>持ち主の方</div>
            <p className={styles.pathText}>
              シールを登録し、落とし物の通知を受け取ります。受け取り確認とお礼の送金まで。
            </p>
            {ownerId ? (
              <a href={`/owner/${ownerId}`} className={styles.cta}>
                マイページへ <span aria-hidden>→</span>
              </a>
            ) : (
              <a href="/owner/login" className={styles.cta}>
                ログイン <span aria-hidden>→</span>
              </a>
            )}
          </div>

          <div className={styles.path}>
            <div className={styles.pathLabel}>拾った方 — ログイン不要</div>
            <p className={styles.pathText}>
              シールのQRを読み取ると届け出フォームが開きます。読み取れないときは記載のコードを入力してください。
            </p>
            <form onSubmit={goToTag} className={styles.codeForm}>
              <input
                className={styles.codeInput}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="demo-token-123"
                aria-label="シールのコード"
              />
              <button type="submit" className={styles.cta} disabled={!code.trim()}>
                届け出る <span aria-hidden>→</span>
              </button>
            </form>
          </div>
        </div>

        <div className={styles.stepsHead}>使い方</div>
        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepNum}>01</span>
            <span>シールを持ち物に貼り、アプリで登録する</span>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>02</span>
            <span>持ち物をなくす</span>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>03</span>
            <span>拾った人がQRを読み取り、手渡し / 郵送を選んで届け出る</span>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>04</span>
            <span>持ち主に通知が届き、受け取る</span>
          </li>
          <li className={styles.step}>
            <span className={styles.stepNum}>05</span>
            <span>受け取り確認をすると、相手がログイン済みならお礼が送られる</span>
          </li>
        </ol>

        <div className={styles.footer}>KAEKURU</div>
      </div>
    </div>
  )
}
