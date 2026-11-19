import { lights } from './journey'

type Record = { opening: number; light: number; inverted: boolean; phrase: string }

function writeLines(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number) {
  let line = ''
  for (const char of text) {
    if (line && context.measureText(line + char).width > width) {
      const boundary = line.lastIndexOf(' ')
      const head = boundary > 0 ? line.slice(0, boundary) : line
      context.fillText(head, x, y)
      line = boundary > 0 ? line.slice(boundary + 1) : ''
      y += 70
    }
    line += char
  }
  context.fillText(line, x, y)
}

export async function downloadRecord({ opening, light, inverted, phrase }: Record) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1500
  const ink = canvas.getContext('2d')
  if (!ink) return false
  await document.fonts.load('84px "Instrument Serif"')
  ink.fillStyle = '#e9e2d4'
  ink.fillRect(0, 0, canvas.width, canvas.height)
  const color = light === 2 ? '#345c73' : light === 1 ? '#706638' : '#8e5839'
  ink.strokeStyle = '#3f38302b'
  ink.strokeRect(70, 70, 1060, 1360)
  ink.fillStyle = '#24211e'
  ink.font = '22px "Space Grotesk Variable", sans-serif'
  ink.fillText('MUSEUM OF IMPOSSIBLE THINGS', 112, 133)
  ink.fillStyle = color
  ink.fillText('FIELD RECORD ' + String(Math.round(opening * 100)).padStart(3, '0'), 112, 165)

  ink.save()
  ink.translate(600, 551)
  if (inverted) ink.rotate(Math.PI)
  for (let rib = 0; rib < 15; rib++) {
    const size = 1 - rib * .055
    const shift = Math.sin(rib * .47) * opening * 32
    ink.lineWidth = rib === 0 ? 2.7 : 1.5
    ink.strokeStyle = color
    ink.strokeRect(shift - 350 * size, -306 * size, 700 * size, 611 * size)
  }
  ink.beginPath()
  for (let point = 0; point <= 120; point++) {
    const y = -305 + point * 5.08
    const x = Math.sin(point * .18) * 24 + Math.sin(point * .46) * 9
    if (point === 0) ink.moveTo(x, y)
    else ink.lineTo(x, y)
  }
  ink.strokeStyle = '#28221f'
  ink.lineWidth = 2
  ink.stroke()
  ink.restore()

  ink.fillStyle = '#24211e'
  ink.font = '84px "Instrument Serif", Georgia, serif'
  writeLines(ink, phrase, 112, 979, 970)
  ink.fillStyle = color
  ink.font = '23px "Space Grotesk Variable", sans-serif'
  ink.fillText(`APERTURE ${Math.round(opening * 100)}%   /   ${lights[light].toUpperCase()}   /   ${inverted ? 'INVERTED' : 'UPRIGHT'}`, 112, 1367)

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return false
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'museum-field-record.png'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return true
}
