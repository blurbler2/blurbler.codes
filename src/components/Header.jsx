import React from 'react'
import Bike from './Bike'

export default function Header() {
  return (
    <header>
      {/* <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bike />
      </div> */}

      <div>
        <h1>Blurbler</h1>
        <p className="lead">Electronics student • Frontend (React) developer</p>
      </div>
    </header>
  )
}
