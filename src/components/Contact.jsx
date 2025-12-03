import React from 'react'

export default function Contact(){
  return (
    <div className="card" id="contact">
      <div className="section-title">Contact</div>
      <div className="mute">GitHub: <a href="https://github.com/blurbler2" target="_blank" rel="noreferrer" style={{ color:'var(--accent)', textDecoration:'none' }}>@blurbler2</a></div>
      <div className="mute">Email: <a href="mailto: hi@blurbler.codes" style={{ color:'var(--accent)', textDecoration:'none' }}>hi@blurbler.codes</a></div>
    </div>
  )
}
