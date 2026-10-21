import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mergeWorkPatches, workFieldValue } from './workPatches.js'

describe('work patches', () => {
  it('keeps a later empty norm over an older calculated value and leaves other fields', () => {
    const first = mergeWorkPatches(new Map(), [
      { id: 7, n1: 1.5, n2: 3, istnorm: 'А', ot: 0, do_: 10 },
      { id: '8', begoperdate: '01.02.2024 08:15' },
    ])
    const cleared = mergeWorkPatches(first, [{ id: '7', n1: null, n2: null, istnorm: null }])
    const row = { id: 7, n1: 9, n2: 9, istnorm: 'было', begoperdate: '01.01.2024' }

    assert.equal(workFieldValue(row, 'n1', cleared), '')
    assert.equal(workFieldValue(row, 'istnorm', cleared), '')
    assert.equal(workFieldValue(row, 'ot', cleared), 0)
    assert.equal(workFieldValue(row, 'do_', cleared), 10)
    assert.equal(workFieldValue({ id: 8, begoperdate: '01.01.2024' }, 'begoperdate', cleared), '01.02.2024 08:15')
    assert.equal(workFieldValue(row, 'begoperdate', cleared), '01.01.2024')
  })

  it('ignores a patch without an id', () => {
    const overrides = mergeWorkPatches(new Map(), [{ n1: 1 }, null])
    assert.equal(overrides.size, 0)
  })
})
