import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import WordArt from './experience/WordArt'
import { behaviors, defaultPhrase, exhibits, formatPhrase, getRoom, materials, rooms } from './experience/catalog'
import type { Behavior, Material, Room } from './experience/catalog'
import type { Gesture } from './experience/GalleryCanvas'
import './museum.css'

gsap.registerPlugin(useGSAP)
const GalleryCanvas = lazy(() => import('./experience/GalleryCanvas'))
const getMotion = () => localStorage.getItem('museum-motion')
const initialGesture = () => ({ x: 0, y: 0, aimX: 0, aimY: 0 })
const webgl = () => !new URLSearchParams(location.search).has('flat') && Boolean(document.createElement('canvas').getContext('webgl2'))

class RenderBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Mark() {
  return <svg viewBox="0 0 44 44" width="38" height="38" aria-hidden="true" fill="none">
    <path d="M22 2 42 13.5v17L22 42 2 30.5v-17L22 2Z M2 13.5 22 25l20-11.5 M22 25v17M12 8l20 11.5v17M32 8 12 19.5v17" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="22" cy="25" r="2.5" fill="currentColor" />
  </svg>
}

export default function App() {
  const [room, setRoom] = useState(() => getRoom(location.hash))
  const [indexOpen, setIndexOpen] = useState(false)
  const [material, setMaterial] = useState<Material>('Solid')
  const [behavior, setBehavior] = useState<Behavior>('Elastic')
  const [phrase, setPhrase] = useState(defaultPhrase)
  const [draft, setDraft] = useState('')
  const [folded, setFolded] = useState(false)
  const [depth, setDepth] = useState(0)
  const [capable, setCapable] = useState(webgl)
  const [visible, setVisible] = useState(() => !document.hidden)
  const [systemMotion, setSystemMotion] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [motionPreference, setMotionPreference] = useState(getMotion)
  const stage = useRef<HTMLElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const gesture = useRef<Gesture>(initialGesture())
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const navigating = useRef(false)
  const motion = motionPreference === null ? systemMotion : motionPreference === 'true'
  const current = rooms.find(item => item.id === room) ?? rooms[0]
  const position = rooms.indexOf(current)
  const architecture = room === 'room' || room === 'threshold'
  const arrival = room === 'arrival'
  const artwork = architecture ? 'A series of graphite hexagonal passageways lit at their edges' : 'Three polished metal ribbons interwoven into a suspended knot'

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const preference = () => setSystemMotion(!media.matches)
    const visibility = () => setVisible(!document.hidden)
    const route = () => {
      navigating.current = true
      Object.assign(gesture.current, initialGesture())
      setRoom(getRoom(location.hash))
    }
    media.addEventListener('change', preference)
    const contextLost = () => setCapable(false)
    document.addEventListener('webglcontextlost', contextLost, true)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('hashchange', route)
    return () => {
      media.removeEventListener('change', preference)
      document.removeEventListener('webglcontextlost', contextLost, true)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('hashchange', route)
    }
  }, [])

  useEffect(() => {
    if (navigating.current) {
      heading.current?.focus({ preventScroll: true })
      navigating.current = false
    }
  }, [room])

  useEffect(() => {
    if (indexOpen && !dialog.current?.open) dialog.current?.showModal()
    if (!indexOpen && dialog.current?.open) dialog.current.close()
  }, [indexOpen])

  useGSAP(() => {
    if (!motion) return
    gsap.from('.scene-copy > *', { opacity: 0, y: 15, duration: .57, stagger: .075, ease: 'power2.out', clearProps: 'all' })
    gsap.from('.gallery-art', { opacity: .25, scale: architecture ? 1.3 : .88, duration: 1.1, ease: 'power3.out', clearProps: 'all' })
  }, { scope: stage, dependencies: [room, motion, architecture], revertOnUpdate: true })

  function go(target: Room) {
    setIndexOpen(false)
    if (target !== room) location.hash = target
  }

  function pointerMove(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    gesture.current.aimX = (event.clientX - rect.left) / rect.width * 2 - 1
    gesture.current.aimY = (event.clientY - rect.top) / rect.height * 2 - 1
    if (drag.current?.id === event.pointerId) {
      gesture.current.x += (event.clientX - drag.current.x) * .009
      gesture.current.y += (event.clientY - drag.current.y) * .009
      drag.current.x = event.clientX
      drag.current.y = event.clientY
    }
  }

  function keyboard(event: KeyboardEvent<HTMLElement>) {
    const steps: Record<string, [number, number]> = { ArrowRight: [.22, 0], ArrowLeft: [-.22, 0], ArrowDown: [0, .22], ArrowUp: [0, -.22] }
    const step = steps[event.key]
    if (!step) return
    event.preventDefault()
    gesture.current.x += step[0]
    if (architecture) gesture.current.aimY = Math.max(-1, Math.min(1, gesture.current.aimY + step[1]))
    else gesture.current.y += step[1]
  }

  function toggleMotion() {
    setMotionPreference(String(!motion))
    localStorage.setItem('museum-motion', String(!motion))
  }

  const fallback = <div className={`fallback fallback-${architecture ? 'room' : 'light'}`} role="img" aria-label={artwork} />

  return <>
    <a className="skip" href="#gallery-heading" onClick={event => { event.preventDefault(); heading.current?.focus() }}>Skip to exhibition</a>
    <header className="masthead">
      <button className="brand" onClick={() => go('arrival')} aria-label="Museum of Impossible Things, return to entrance"><Mark /><span>MUSEUM OF<br />IMPOSSIBLE THINGS</span></button>
      <span className="header-center">INDEPENDENT DIGITAL MUSEUM</span>
      <button type="button" className="index-toggle" onClick={() => setIndexOpen(true)} aria-haspopup="dialog"><span>Exhibition index</span><span className="grid-icon" aria-hidden="true">▦</span></button>
    </header>
    <main ref={stage} className={`stage stage-${room}`}>
      <div className="stage-grid" aria-hidden="true" />
      {room === 'words' ? <div className="gallery-art"><WordArt key={phrase} phrase={phrase} behavior={behavior} motion={motion} /></div> :
        <div className="gallery-art spatial" tabIndex={capable ? 0 : undefined} role="group" aria-label={`${artwork}. ${capable ? current.hint : 'Static artwork preview'}`}
          onPointerDown={event => {
            if (!capable) return
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
          }} onPointerMove={pointerMove} onLostPointerCapture={() => { drag.current = null }} onPointerLeave={() => {
            gesture.current.aimX = 0
            gesture.current.aimY = 0
          }} onKeyDown={keyboard}>
          {capable ? <RenderBoundary fallback={fallback}><Suspense fallback={fallback}>
            <GalleryCanvas room={room} material={arrival ? 'Solid' : room === 'closing' ? 'Spectral' : material} folded={folded && room === 'room'} depth={room === 'room' ? depth : 0} motion={motion && !indexOpen} gesture={gesture} visible={visible} />
          </Suspense></RenderBoundary> : fallback}
        </div>}
      <div className="scene-copy" key={room}>
        <div className="eyebrow"><span className="signal" />{arrival ? 'A DIGITAL EXHIBITION IN THREE ACTS' : position === 1 ? 'THE MUSEUM / ENTRY' : position === 5 ? 'THE MUSEUM / EXIT' : `EXHIBITION / ${current.number}`}</div>
        <h1 id="gallery-heading" ref={heading} tabIndex={-1}>{arrival ? <>Reality is a<br /><em>suggestion.</em></> : current.title}</h1>
        <p className="description">{current.description}</p>
        {arrival && <button className="primary" onClick={() => go('threshold')}>Enter the impossible <span aria-hidden="true">↗</span></button>}
        {room === 'threshold' && <button className="primary" onClick={() => go('light')}>Enter exhibition 01 <span aria-hidden="true">↗</span></button>}
        {room === 'light' && <div className="controls">
          <fieldset><legend>Material state</legend>{materials.map(mode => <button key={mode} aria-pressed={mode === material} onClick={() => setMaterial(mode)}>{mode}</button>)}</fieldset>
          <button className="small-control" onClick={() => Object.assign(gesture.current, initialGesture())}>Reset orientation</button>
        </div>}
        {room === 'words' && <div className="controls">
          <form className="phrase-form" onSubmit={event => { event.preventDefault(); setPhrase(formatPhrase(draft)) }}>
            <label htmlFor="phrase">Your phrase</label><div><input id="phrase" maxLength={36} placeholder={defaultPhrase} value={draft} onChange={event => setDraft(event.target.value)} /><button type="submit">Set</button></div>
          </form>
          <fieldset><legend>Behavior</legend>{behaviors.map(mode => <button key={mode} aria-pressed={mode === behavior} onClick={() => setBehavior(mode)}>{mode}</button>)}</fieldset>
          <button className="small-control" onClick={() => { setDraft(''); setPhrase(defaultPhrase); setBehavior('Elastic') }}>Reset typography</button>
        </div>}
        {room === 'room' && <div className="controls">
          <label className="depth">Passage depth<input type="range" min="0" max="1" step=".01" value={depth} onChange={event => setDepth(event.target.valueAsNumber)} /></label>
          <button className="outline" aria-pressed={folded} onClick={() => setFolded(value => !value)}>{folded ? 'Unfold the room' : 'Fold the room'}</button>
        </div>}
        {room === 'closing' && <div className="closing-actions"><button className="primary" onClick={() => go('arrival')}>Return to entrance <span aria-hidden="true">↗</span></button><a href="https://github.com/Amanor-12/museum-of-impossible-things">Project credits</a></div>}
      </div>
      {current.hint && <span className="art-caption"><span aria-hidden="true">◎</span> {capable || room === 'words' ? current.hint : 'Static artwork preview'}</span>}
      <div className="plate-number" aria-hidden="true">{current.number} / 03</div>
    </main>
    <footer className="wayfinding">
      <button className="motion" aria-pressed={motion} onClick={toggleMotion}><span className={motion ? 'signal' : 'signal off'} />Motion {motion ? 'on' : 'off'}</button>
      <nav aria-label="Exhibition navigation">
        {position > 0 && <button onClick={() => go(rooms[position - 1].id)} aria-label="Previous room">←</button>}
        {exhibits.map(exhibit => <button key={exhibit.id} aria-current={room === exhibit.id ? 'page' : undefined} aria-label={exhibit.title} onClick={() => go(exhibit.id)}>{exhibit.number}</button>)}
        {position < rooms.length - 1 && <button onClick={() => go(rooms[position + 1].id)} aria-label="Next room">→</button>}
      </nav>
      <span className="footer-id">{arrival ? 'EST. IN NOWHERE' : current.title}</span>
    </footer>
    <dialog ref={dialog} className="index" onClose={() => setIndexOpen(false)} aria-labelledby="index-title">
      <div className="index-header"><Mark /><button className="outline" onClick={() => setIndexOpen(false)}>Close <span aria-hidden="true">×</span></button></div>
      <div className="index-inner"><div className="eyebrow">THE MUSEUM / DIRECTORY</div><h2 id="index-title">Exhibition <em>index.</em></h2>
        <div className="index-list">{exhibits.map(exhibit => <button className="index-entry" key={exhibit.id} onClick={() => go(exhibit.id)}>
          <div className={`index-preview preview-${exhibit.id}`} aria-hidden="true" /><span className="entry-number">{exhibit.number}</span>
          <div><strong>{exhibit.title}</strong><p>{exhibit.description}</p><small>{exhibit.hint}</small></div><span className="entry-arrow" aria-hidden="true">↗</span>
        </button>)}</div></div>
    </dialog>
  </>
}



