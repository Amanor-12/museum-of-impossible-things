import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { defaultPhrase, exhibits, formatPhrase, getRoom } from '../src/experience/catalog.ts'
import { seamCenter, seamStrain } from '../src/experience/seam.ts'

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
