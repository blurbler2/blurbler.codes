import React from 'react'

export default function Bike() {
  return (
    <div className="bike-wrap" aria-hidden="true" title="Bicycle decorative">
      <svg
        viewBox="0 0 240 110"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="false"
        focusable="false"
      >
        <g transform="translate(10,10)">

          {/* BACK WHEEL */}
          <g transform="translate(40,70)">
            <g className="bike-wheel-group back">
              <circle className="bike-wheel" r="30" cx="0" cy="0" />
              <g stroke="var(--muted)" strokeWidth="1.6">
                <line x1="0" y1="-20" x2="0" y2="20" />
                <line x1="-14" y1="-14" x2="14" y2="14" />
                <line x1="-20" y1="0" x2="20" y2="0" />
              </g>

              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 0 0"
                to="-360 0 0"
                dur="1s"
                repeatCount="indefinite"
              />
            </g>
          </g>

          {/* FRONT WHEEL */}
          <g transform="translate(150,70)">
            <g className="bike-wheel-group front">
              <circle className="bike-wheel" r="30" cx="0" cy="0" />
              <g stroke="var(--muted)" strokeWidth="1.6">
                <line x1="0" y1="-20" x2="0" y2="20" />
                <line x1="-14" y1="-14" x2="14" y2="14" />
                <line x1="-20" y1="0" x2="20" y2="0" />
              </g>

              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 0 0"
                to="360 0 0"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </g>
          </g>
          <g
            className="bike-frame"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          >
            {/* Seat/top point centered between wheels */}
            {/* Back wheel → seat tube */}
            <line x1="40" y1="70" x2="80" y2="25" />

            {/* Bottom tube (straight between wheels) */}
            <line x1="40" y1="70" x2="85" y2="70" />

            {/* Top tube */}
            {/* <line x1="110" y1="25" x2="180" y2="70" /> */}

            {/* Seat stay (small angled tube from front wheel upward) */}
            <line x1="130" y1="25" x2="150" y2="70" />

            {/* Chain stay (small horizontal tube behind front wheel) */}
            {/* <line x1="180" y1="70" x2="205" y2="70" /> */}
          </g>

          {/* PEDAL HUB */}
          {/* <circle className="bike-line" cx="110" cy="70" r="8" /> */}

        </g> 
      </svg>
    </div>
  )
}
