import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { defaultPhrase, exhibits, formatPhrase, getRoom } from '../src/experience/catalog.ts'
import { seamCenter, seamStrain } from '../src/experience/seam.ts'
import { clampOpening, defaultInscription, getChapter, inscriptionFrom } from '../src/threshold/journey.ts'

test('routing accepts known rooms and resolves unknown routes to the entrance', () => {
  assert.equal(getRoom('#light'), 'light')
  assert.equal(getRoom('#unlisted'), 'arrival')
  assert.equal(getRoom(''), 'arrival')
  assert.deepEqual(exhibits.map(room => room.id), ['light', 'words', 'room'])
})

test('phrases normalize whitespace, default when empty and stay bounded', () => {
  assert.equal(formatPhrase('  fly \n  away '), 'fly away')
  assert.equal(formatPhrase(' '), defaultPhrase)
  assert.equal(formatPhrase('x'.repeat(45)).length, 36)
  assert.equal(formatPhrase('<b>hi</b>'), '<b>hi</b>')
})

test('the strain changes sign at the seam and falls off with distance', () => {
  const position = .5
  const center = seamCenter(position)
  assert.equal(seamStrain(center, position), 0)
  assert.equal(Math.abs(seamStrain(.4, 0)), 0)
  assert.ok(seamStrain(center - .08, position) < 0)
  assert.ok(seamStrain(center + .08, position) > 0)
  assert.ok(Math.abs(seamStrain(0, position)) < .001)
  assert.ok(seamCenter(.8) > center)
})

test('the new exhibition preserves old links and keeps authored text and aperture bounded', () => {
  assert.equal(getChapter('#words'), 2)
  assert.equal(getChapter('#not-a-room'), 0)
  assert.equal(getChapter('#room'), 3)
  assert.equal(getChapter('#return'), 4)
  assert.equal(clampOpening(.576), .58)
  assert.equal(clampOpening(-2), 0)
  assert.equal(clampOpening(3), 1)
  assert.equal(inscriptionFrom('  '), defaultInscription)
  assert.equal(inscriptionFrom('  fault    line '), 'fault line')
  assert.equal(inscriptionFrom('x'.repeat(73)).length, 52)
})
