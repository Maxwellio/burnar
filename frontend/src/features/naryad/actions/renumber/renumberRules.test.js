import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { RENUMBER_LABEL, canRenumber } from './renumberRules.js'

describe('renumber level', () => {
  it('uses the zadanie hint for both parts', () => {
    assert.equal(RENUMBER_LABEL, 'Обновить нумерацию на данном уровне')
  })

  it('enables the button for one selected row of an open part', () => {
    assert.equal(canRenumber(['10'], false, false), true)
    assert.equal(canRenumber(['10'], true, false), false)
    assert.equal(canRenumber(['10'], null, false), false)
    assert.equal(canRenumber([], false, false), false)
    assert.equal(canRenumber(['10', '11'], false, false), false)
    assert.equal(canRenumber(['10'], false, true), false)
    assert.equal(canRenumber(null, false, false), false)
  })
})
