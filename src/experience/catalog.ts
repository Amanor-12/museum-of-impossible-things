export const rooms = [
  { id: 'arrival', number: '00', title: 'Arrival', description: 'An exhibition for things that refuse to exist.', hint: 'Drag to rotate' },
  { id: 'threshold', number: '00', title: 'The Threshold', description: 'Beyond this point, the usual laws no longer apply.', hint: 'Move to look around' },
  { id: 'light', number: '01', title: 'The Weight of Light', description: 'What if light had mass, and metal could remember being liquid?', hint: 'Drag or use the arrow keys' },
  { id: 'words', number: '02', title: 'Words That Refuse to Stay Still', description: 'Here, language takes up space. Give it something to say.', hint: 'Move, tap, or press Enter on the artwork' },
  { id: 'room', number: '03', title: 'The Room That Breathes', description: 'A corridor with a pulse. Its far end is closer than it appears.', hint: 'Move to look or use the arrow keys' },
  { id: 'closing', number: '04', title: 'The Impossible Was Never the Problem.', description: 'Perhaps the laws we trusted were only habits of looking.', hint: '' },
] as const

export const exhibits = rooms.slice(2, 5)
export const defaultPhrase = 'LANGUAGE MOVES'
export const materials = ['Solid', 'Fluid', 'Spectral'] as const
export const behaviors = ['Elastic', 'Fragment', 'Liquid'] as const
export type Material = typeof materials[number]
export type Behavior = typeof behaviors[number]
export type Room = typeof rooms[number]['id']
export const getRoom = (hash: string) => rooms.find(room => room.id === hash.slice(1))?.id ?? 'arrival'
export const formatPhrase = (value: string) => value.trim().replace(/\s+/gu, ' ').slice(0, 36) || defaultPhrase
