import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { continuousCommitValue, discreteCommitValue } from './operParamRules.js'

describe('oper param commit', () => {
  it('saves a continuous value when the number changed and clears it when the field is empty', () => {
    assert.deepEqual(continuousCommitValue('1,50', '1,5'), { save: false })
    assert.deepEqual(continuousCommitValue('1,50', '2'), { save: true, value: 2 })
    assert.deepEqual(continuousCommitValue('1,50', ''), { save: true, value: null })
    assert.deepEqual(continuousCommitValue('', '-'), { save: false, revert: true })
    assert.deepEqual(continuousCommitValue('1', '1,2,3'), { save: false, revert: true })
  })

  it('saves a discrete code and treats the empty option as null', () => {
    assert.deepEqual(discreteCommitValue(15, '15'), { save: false })
    assert.deepEqual(discreteCommitValue(15, '16'), { save: true, value: 16 })
    assert.deepEqual(discreteCommitValue(15, ''), { save: true, value: null })
    assert.deepEqual(discreteCommitValue(null, ''), { save: false })
  })
})
