import { seamCenter, seamStrain } from './seam'
import type { Room } from './catalog'

const observations: Record<Room, string> = {
  arrival: '',
  threshold: 'Move the seam. It stays where you leave it.',
  light: 'Metal kinks where the seam passes.',
  words: 'The seam shears the lines of type.',
  room: 'The same seam runs through the corridor.',
  closing: 'The museum keeps the position you leave behind.',
}

export default function SeamControl({ room, position, setPosition }: { room: Room; position: number; setPosition: (position: number) => void }) {
  const value = Math.round(position * 100)
  const trace = Array.from({ length: 49 }, (_, i) => {
    const point = i / 48
    return `${i === 0 ? 'M' : 'L'}${point * 160} ${19 - 23 * seamStrain(point, position)}`
  }).join(' ')

  return <section className="seam-control" aria-labelledby="seam-label">
    <label id="seam-label" htmlFor="seam-position"><span aria-hidden="true">∿</span> The seam</label>
    <div className="seam-input">
      <svg viewBox="0 0 160 38" preserveAspectRatio="none" aria-hidden="true">
        <path className="seam-baseline" d="M0 19H160" />
        <path className="seam-trace" d={trace} />
        {position > 0 && <path className="seam-marker" d={`M${seamCenter(position) * 160} 4v30`} />}
      </svg>
      <input id="seam-position" type="range" min="0" max="100" value={value}
        aria-valuetext={value === 0 ? 'Dormant' : `${value}% through the gallery`}
        aria-describedby="seam-observation"
        onChange={event => setPosition(event.target.valueAsNumber / 100)} />
    </div>
    <p id="seam-observation">{observations[room]}</p>
    <button className="seam-reset" disabled={position === 0} onClick={() => setPosition(0)}>Clear seam</button>
  </section>
}
