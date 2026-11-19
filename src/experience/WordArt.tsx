import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { Behavior } from './catalog'
import { seamStrain } from './seam'

export default function WordArt({ phrase, behavior, motion, seam }: { phrase: string; behavior: Behavior; motion: boolean; seam: number }) {
  const [target, setTarget] = useState({ x: 0, y: 0 })
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timeout.current), [])
  const activate = (x: number, y: number) => {
    clearTimeout(timeout.current)
    setTarget({ x, y })
    timeout.current = setTimeout(() => setTarget({ x: 0, y: 0 }), 520)
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    activate((event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1)
  }
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(.85, -.7)
    }
  }
  const sliced = behavior === 'Fragment' || seam > 0
  const force = Math.min(1, Math.hypot(target.x, target.y))
  const words = phrase.toLocaleUpperCase().split(' ')
  const split = words.length > 1 ? Math.ceil(words.length / 2) : 1
  const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')].filter(Boolean)
  return <button type="button" className={`word-art ${motion ? '' : 'still'}`} aria-label={`Interact with typographic artwork: ${phrase}`} onPointerMove={move} onPointerDown={move} onClick={event => { if (event.detail === 0) activate(.8, -.5) }} onKeyDown={keyboard}>
    <svg viewBox="0 0 820 490" aria-hidden="true">
      <defs>
        <filter id="liquid" x="-25%" width="150%" y="-80%" height="260%">
          <feTurbulence type="fractalNoise" baseFrequency=".009 .037" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale={motion ? 14 + force * 70 : 23} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {Array.from({ length: 12 }, (_, i) => <clipPath id={`slice-${i}`} key={i}><rect x={0} y={i * 42} width={820} height={42} /></clipPath>)}
      </defs>
      <circle cx="410" cy="245" r="196" className="word-orbit" />
      <path d="M0 245H820M410 0V490" className="word-orbit" />
      {Array.from({ length: sliced ? 12 : 1 }, (_, band) =>
        <g key={band} clipPath={sliced ? `url(#slice-${band})` : undefined}
          style={{ transformOrigin: 'center', transform: `translateX(${seamStrain((band + .5) / 12, seam) * 125 + (behavior === 'Fragment' ? Math.sin(band * 11) * (6 + force * 49) : 0)}px)` }}>
          <g style={{ transformOrigin: 'center', transform: behavior === 'Elastic' ? `skewX(${target.x * 17}deg) scaleY(${1 + target.y * .27})` : undefined }}>
            {lines.map((line, i) => <text key={i} x="410" y={lines.length === 1 ? 282 : 210 + i * 126}
            fontSize={Math.min(124, 1200 / line.length)} textAnchor="middle"
            filter={behavior === 'Liquid' ? 'url(#liquid)' : undefined}>{line}</text>)}
          </g>
        </g>)}
    </svg>
  </button>
}
