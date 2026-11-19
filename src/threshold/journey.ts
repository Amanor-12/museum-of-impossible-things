export const chapters = [
  { id: 'threshold', mark: 'I', title: 'The threshold', level: .08 },
  { id: 'passage', mark: 'II', title: 'The displaced room', level: .63 },
  { id: 'inscription', mark: 'III', title: 'The inscription', level: .63 },
  { id: 'inversion', mark: 'IV', title: 'The inversion', level: .63 },
  { id: 'return', mark: 'V', title: 'The return', level: .63 },
] as const

export const lights = ['Raking light', 'Soft light', 'Blue light'] as const

export const defaultInscription = 'Nothing stays where you leave it.'

export function getChapter(hash: string) {
  const id = hash.slice(1)
  if (id === 'light') return 1
  if (id === 'words') return 2
  if (id === 'room') return 3
  if (id === 'closing') return 4
  const index = chapters.findIndex(chapter => chapter.id === id)
  return Math.max(0, index)
}

export const clampOpening = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 100) / 100

export function inscriptionFrom(value: string) {
  return value.trim().replace(/\s+/gu, ' ').slice(0, 52) || defaultInscription
}
