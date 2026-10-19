import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { canCreateEmptyVipolnenie } from './createRules.js'

describe('canCreateEmptyVipolnenie', () => {
  const ready = {
    closed: true,
    hasRoots: true,
    hasVipolnenie: false,
    pending: false,
  }

  it('is available only for a closed zadanie that still has no vipolnenie', () => {
    assert.equal(canCreateEmptyVipolnenie(ready), true)
  })

  it('stays off while the header, the tree or a request is not ready', () => {
    assert.equal(canCreateEmptyVipolnenie({ ...ready, closed: false }), false)
    assert.equal(canCreateEmptyVipolnenie({ ...ready, closed: null }), false)
    assert.equal(canCreateEmptyVipolnenie({ ...ready, hasRoots: false }), false)
    assert.equal(canCreateEmptyVipolnenie({ ...ready, hasRoots: undefined }), false)
    assert.equal(canCreateEmptyVipolnenie({ ...ready, hasVipolnenie: true }), false)
    assert.equal(canCreateEmptyVipolnenie({ ...ready, pending: true }), false)
  })
})
