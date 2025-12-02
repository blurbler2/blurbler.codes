import React from 'react'

export default function Projects(){
  return (
    <div className="card">
      <div className="section-title">Projects</div>
      <ul style={{ margin:0, paddingLeft:18, color:'var(--muted)' }}>
        <li>Frontend apps with React — dynamic UIs & component design</li>
        <li>Electronics prototypes — sensors, microcontrollers, and power management</li>
        <li>Personal tools — small utilities for productivity and dev workflows</li>
      </ul>
    </div>
  )
}
