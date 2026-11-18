import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildCreatePayload, canCreateNaryad } from './createNaryadRules.js'

describe('canCreateNaryad', () => {
  it('requires a brigade and an idle form', () => {
    assert.equal(canCreateNaryad({ brigadeId: '12', saving: false, loading: false }), true)
    assert.equal(canCreateNaryad({ brigadeId: '', saving: false, loading: false }), false)
    assert.equal(canCreateNaryad({ brigadeId: null, saving: false, loading: false }), false)
    assert.equal(canCreateNaryad({ brigadeId: '12', saving: true, loading: false }), false)
    assert.equal(canCreateNaryad({ brigadeId: '12', saving: false, loading: true }), false)
  })
})

describe('buildCreatePayload', () => {
  it('sends the brigade and only the filled optional fields', () => {
    assert.deepEqual(
      buildCreatePayload({ name: '  Наряд 1  ', brigadeId: '7', begDate: '2026-11-18T08:30:00' }),
      { ownerNar: 7, nameNar: 'Наряд 1', begDate: '2026-11-18T08:30:00' },
    )
    assert.deepEqual(
      buildCreatePayload({ name: '   ', brigadeId: '7', begDate: null }),
      { ownerNar: 7 },
    )
  })
})
