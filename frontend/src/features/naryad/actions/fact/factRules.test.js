import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FACT_KORR_HINT,
  canEditFact,
  factCommitValue,
} from './factRules.js'

describe('canEditFact', () => {
  const row = { operlifetype: 80, locked: 0, kor: 0 }

  it('allows an open unlocked work without a correlation rule', () => {
    assert.equal(canEditFact(row, false), true)
    assert.equal(canEditFact({ ...row, operlifetype: '78' }, false), true)
    assert.equal(canEditFact({ ...row, operlifetype: 82, hasChildren: true }, false), true)
  })

  it('keeps a closed part, a lock, type 81, a block and a correlation rule read-only', () => {
    assert.equal(canEditFact(row, true), false)
    assert.equal(canEditFact({ ...row, locked: 1 }, false), false)
    assert.equal(canEditFact({ ...row, locked: '1' }, false), false)
    assert.equal(canEditFact({ ...row, operlifetype: 81 }, false), false)
    assert.equal(canEditFact({ ...row, operlifetype: '' }, false), false)
    assert.equal(canEditFact({ ...row, operlifetype: null }, false), false)
    assert.equal(canEditFact({ ...row, kor: 1 }, false), false)
    assert.equal(canEditFact({ ...row, kor: '1' }, false), false)
    assert.equal(canEditFact(null, false), false)
    assert.equal(canEditFact(row, null), false)
  })
})

describe('factCommitValue', () => {
  it('saves hours when the number changed and clears the cell when it is empty', () => {
    assert.deepEqual(factCommitValue('1,50', '1,5'), { save: false })
    assert.deepEqual(factCommitValue('1,50', '2'), { save: true, value: 2 })
    assert.deepEqual(factCommitValue('1,50', ''), { save: true, value: null })
    assert.deepEqual(factCommitValue('', '-'), { save: false, revert: true })
    assert.equal(FACT_KORR_HINT.includes('коррел'), true)
  })
})
