export function drawInscription(canvas: HTMLCanvasElement, phrase: string) {
  const ink = canvas.getContext('2d')
  if (!ink) return
  canvas.width = 1024
  canvas.height = 384
  ink.font = '126px "Instrument Serif", Georgia, serif'
  ink.fillStyle = '#fff'
  ink.textAlign = 'center'
  ink.textBaseline = 'middle'
  const lines: string[] = []
  let line = ''
  for (const symbol of phrase) {
    if (line && ink.measureText(line + symbol).width > 950) {
      const boundary = line.lastIndexOf(' ')
      lines.push(boundary > 0 ? line.slice(0, boundary) : line)
      line = boundary > 0 ? line.slice(boundary + 1) : ''
    }
    line += symbol
  }
  lines.push(line)
  const spacing = Math.min(112, 360 / lines.length)
  ink.font = `${Math.min(126, spacing + 12)}px "Instrument Serif", Georgia, serif`
  lines.forEach((value, i) => ink.fillText(value.trim(), 512, 192 + (i - (lines.length - 1) / 2) * spacing, 950))
}
