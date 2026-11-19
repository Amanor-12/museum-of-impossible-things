import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react'
import Chamber from './Chamber'
import { chapters, clampOpening, defaultInscription, getChapter, inscriptionFrom, lights } from './journey'
import { downloadRecord } from './record'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import './threshold.css'

const archive = import.meta.env.BASE_URL + '?archive'
const artwork = [
  'Two graphite walls meet at a fault. Warm light falls through the opening onto the floor.',
  'The parted walls reveal a concrete passage with offset arches and a suspended stone.',
  'An inscription on the back of the graphite walls breaks where the walls part.',
  'The displaced corridor rotates around its vanishing point.',
  'The corridor tilts back into view, with the sentence you left behind.',
]

function Monogram() {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M2.5 26V6l10 7v13M19.5 26V13l10-7v20M12.5 13l7-5v5l-7 5" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="bevel" /></svg>
}

export default function Threshold() {
  const [chapter, setChapter] = useState(() => getChapter(location.hash))
  const [opening, setOpening] = useState<number>(() => chapters[getChapter(location.hash)].level)
  const [changing, setChanging] = useState(false)
  const [motion, setMotion] = useState(() => (localStorage.getItem('museum-motion') ?? String(!matchMedia('(prefers-reduced-motion: reduce)').matches)) === 'true')
  const [index, setIndex] = useState(false)
  const [phrase, setPhrase] = useState(defaultInscription)
  const [draft, setDraft] = useState('')
  const [light, setLight] = useState(0)
  const [inverted, setInverted] = useState(false)
  const [exportState, setExportState] = useState<'ready' | 'writing' | 'sent' | 'error'>('ready')
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const drag = useRef<{ id: number; x: number; start: number; distance: number } | null>(null)
  const moved = useRef(false)
  const routeFocus = useRef(false)
  const room = chapters[chapter]
  const ready = opening >= .57

  useEffect(() => {
    const route = () => {
      routeFocus.current = true
      const next = getChapter(location.hash)
      setChapter(next)
      if (next !== 0) setOpening(value => value >= .57 ? value : chapters[next].level)
    }
    window.addEventListener('hashchange', route)
    return () => window.removeEventListener('hashchange', route)
  }, [])

  useEffect(() => {
    if (!routeFocus.current) return
    routeFocus.current = false
    heading.current?.focus({ preventScroll: true })
  }, [chapter])

  function go(next: number) {
    dialog.current?.close()
    if (next !== chapter) location.hash = chapters[next].id
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { id: event.pointerId, x: event.clientX, start: opening, distance: Math.min(innerWidth * .3, 380) }
    moved.current = false
    setChanging(true)
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current
    if (active?.id !== event.pointerId) return
    const distance = event.clientX - active.x
    if (Math.abs(distance) < 4 && !moved.current) return
    moved.current = true
    setOpening(clampOpening(active.start + distance / active.distance))
  }

  function finishDrag() {
    drag.current = null
    setChanging(false)
  }

  function stepOpening(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (event.key === 'Home' || event.key === 'End') setOpening(event.key === 'Home' ? 0 : 1)
    else setOpening(value => clampOpening(value + (event.key === 'ArrowRight' ? .1 : -.1)))
  }

  function toggleMotion() {
    setMotion(value => !value)
    localStorage.setItem('museum-motion', String(!motion))
  }

  function restart() {
    setOpening(chapters[0].level)
    setPhrase(defaultInscription)
    setDraft('')
    setLight(0)
    setInverted(false)
    setExportState('ready')
    go(0)
  }

  async function exportPrint() {
    setExportState('writing')
    try {
      const saved = await downloadRecord({ opening, light, inverted, phrase })
      setExportState(saved ? 'sent' : 'error')
    } catch {
      setExportState('error')
    }
  }

  return <div className={`threshold-site act-${chapter}`} data-motion={motion} data-light={light} data-inverted={inverted} style={{ '--opening': opening } as CSSProperties}>
    <header className="threshold-header">
      <button type="button" className="threshold-brand" onClick={restart} aria-label="Museum of Impossible Things, return to entrance"><Monogram /><span>MUSEUM OF<br />IMPOSSIBLE THINGS</span></button>
      <span className="museum-location">A MUSEUM WITHOUT AN ADDRESS</span>
      <button type="button" className="threshold-index" aria-haspopup="dialog" aria-expanded={index} onClick={() => { dialog.current?.showModal(); setIndex(true) }}>
        Index <span className="index-glyph" aria-hidden="true"><i /><i /><i /></span>
      </button>
    </header>
    <main className="threshold-main">
      <figure className="threshold-art" aria-label={artwork[chapter]}>
        <div className="threshold-fallback"><span /><span /></div>
        <Chamber opening={opening} chapter={chapter} changing={changing} motion={motion && !index} gravity={inverted} light={light / 2} phrase={phrase} />
      </figure>
      <div className="threshold-shading" aria-hidden="true" />
      {(chapter === 2 || chapter === 4) && <div className="wall-inscription" aria-hidden="true">
        <span>{phrase}</span><span>{phrase}</span>
      </div>}
      {chapter === 3 && <div className="inversion-gauge" aria-hidden="true">
        <svg viewBox="0 0 180 180" fill="none"><circle cx="90" cy="90" r="68" strokeDasharray="1 7" /><circle cx="90" cy="90" r="52" strokeOpacity=".35" /><path d="M90 45v90M81 57l9-12 9 12M77 90h26" /></svg>
        <span>{inverted ? '180°' : '0°'}</span>
      </div>}
      <section className="threshold-copy" key={room.id} aria-labelledby="chapter-heading">
        <p className="threshold-kicker"><span />{chapter === 0 ? 'An exhibition in five movements' : `Movement ${room.mark}`}</p>
        <h1 id="chapter-heading" ref={heading} tabIndex={-1}>
          {chapter === 0 ? <>The Museum<br /><span className="title-of">of </span><em>Impossible</em><br />Things<span className="title-stop">.</span></> : room.title}
        </h1>
        <p className="threshold-description">{[
          'An exhibition for things that refuse to exist.',
          'You moved one wall. The room behind it moved the other way. Change the light to see where the metal buckled.',
          'Leave a sentence on the wall. The opening will carry half of it away.',
          'Turn the room over. The suspended metal will still point toward the original floor.',
          'The room still holds what you left inside.',
        ][chapter]}</p>
        {chapter === 1 && <fieldset className="light-studies"><legend>Lighting study</legend>
          {lights.map((label, i) => <button type="button" key={label} aria-pressed={light === i} onClick={() => setLight(i)}>{label}</button>)}
        </fieldset>}
        {chapter === 2 && <form className="threshold-form" onSubmit={event => { event.preventDefault(); setPhrase(inscriptionFrom(draft)) }}>
          <label htmlFor="inscription">Your inscription</label>
          <div><input id="inscription" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write on the wall" maxLength={52} />
          <button type="submit">Leave it</button></div>
          <p className="sr-only" role="status">{phrase}</p>
        </form>}
        {(chapter === 2 || chapter === 4) && <details className="inscription-transcript">
          <summary>Read the inscription</summary>
          <p>{phrase}</p>
        </details>}
        {chapter === 3 && <button className="gravity-control" aria-pressed={inverted} onClick={() => setInverted(value => !value)}>{inverted ? 'Restore gravity' : 'Invert gravity'}<span aria-hidden="true">↻</span></button>}
        {chapter === 4 && <div className="field-record">
          <dl aria-label="Visit record">
            <div><dt>Opening</dt><dd>{Math.round(opening * 100)}%</dd></div>
            <div><dt>Light</dt><dd>{lights[light]}</dd></div>
            <div><dt>Gravity</dt><dd>{inverted ? 'Inverted' : 'Upright'}</dd></div>
          </dl>
          <button type="button" disabled={exportState === 'writing'} onClick={exportPrint}>{exportState === 'writing' ? 'Preparing your print…' : 'Download your field record'}</button>
          <p role="status">{exportState === 'sent' ? 'Your print is ready.' : exportState === 'error' ? 'The print could not be created. Try again.' : ''}</p>
        </div>}
      </section>
      {chapter === 0 && <div className="fault-interface" data-dragging={changing}>
        <button className="fault-handle" role="slider" aria-label="Opening in the wall" aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={Math.round(opening * 100)} aria-valuetext={`${Math.round(opening * 100)} percent open`}
          onPointerDown={startDrag} onPointerMove={moveDrag} onLostPointerCapture={finishDrag} onKeyDown={stepOpening}
          onClick={event => { if (!moved.current || event.detail === 0) setOpening(value => clampOpening(value < .25 ? .65 : value + .15)); moved.current = false }}>
          <span aria-hidden="true">⟷</span>
        </button>
        <span className="fault-label" aria-hidden="true">{changing ? `${Math.round(opening * 100)}% open` : ready ? 'Passage open' : 'Pull the opening'}</span>
      </div>}
      <div className="threshold-action">
        {chapter === 0 && <button className="threshold-primary" onClick={() => ready ? go(1) : setOpening(.68)}>{ready ? 'Cross the threshold' : 'Open the passage'}<span className="threshold-sigil" aria-hidden="true" /></button>}
        {chapter === 1 && <button className="threshold-primary" onClick={() => go(2)}>Approach the inscription<span className="threshold-sigil" aria-hidden="true" /></button>}
        {chapter === 2 && <button className="threshold-primary" onClick={() => go(3)}>Enter the inversion<span className="threshold-sigil" aria-hidden="true" /></button>}
        {chapter === 3 && <button className="threshold-primary" onClick={() => go(4)}>Look back<span className="threshold-sigil" aria-hidden="true" /></button>}
        {chapter === 4 && <button className="threshold-primary" onClick={restart}>Begin again<span className="threshold-sigil" aria-hidden="true" /></button>}
      </div>
    </main>
    <footer className="threshold-footer">
      <span className="chapter-caption"><span>{room.mark.padStart(3, ' ')}</span>{room.title}</span>
      <nav aria-label="Museum movements">
        {chapters.map((item, i) => <button key={item.id} aria-label={item.title} aria-current={i === chapter ? 'step' : undefined} onClick={() => go(i)}><span>{item.mark}</span></button>)}
      </nav>
      <button className="threshold-motion" aria-pressed={motion} onClick={toggleMotion}><span aria-hidden="true">{motion ? '◌' : '○'}</span> Motion {motion ? 'on' : 'off'}</button>
    </footer>
    <dialog className="threshold-directory" ref={dialog} onClose={() => setIndex(false)} aria-labelledby="directory-title">
      <div className="directory-top"><Monogram /><button onClick={() => dialog.current?.close()}>Close <span aria-hidden="true">×</span></button></div>
      <h2 id="directory-title">Museum index<span>.</span></h2>
      <div className="directory-list">{chapters.map((item, i) => <button key={item.id} onClick={() => go(i)} aria-current={i === chapter ? 'step' : undefined}><small>{item.mark}</small>{item.title}<span className="threshold-sigil" aria-hidden="true" /></button>)}</div>
      <details className="field-notes">
        <summary>Field notes</summary>
        <dl>
          <div><dt>The fault</dt><dd>The building was measured before it was opened. After the first opening, the interior was wider than the space that contained it.</dd></div>
          <div><dt>The suspended foil</dt><dd>Under raking light its cut edge appears straight. Under blue light you can see where the opening has twisted it.</dd></div>
          <div><dt>The return</dt><dd>The museum records the opening, the light, and which way the floor was facing. It has no way to register what the visitor meant.</dd></div>
        </dl>
      </details>
      <a className="archive-link" href={archive}>Visit the original exhibition archive</a>
    </dialog>
  </div>
}
