import React from 'react'

export default function MethodChooser({ onPick }: { onPick: (m: 'dropoff' | 'mail') => void }) {
  return (
    <>
      <h2 className="section-title">届け方を選んでください</h2>
      <div className="row">
        <button className="button lg" onClick={() => onPick('dropoff')}>どこかに届ける</button>
        <button className="button lg" onClick={() => onPick('mail')}>郵送する</button>
      </div>
    </>
  )
}
