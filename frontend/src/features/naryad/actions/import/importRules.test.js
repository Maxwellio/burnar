import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { IMPORT_CONFIRM, canImportZadanieWorks } from './importRules.js'

describe('canImportZadanieWorks', () => {
  const ready = {
    closed: false,
    lockFlags: new Map(),
    pending: false,
  }

  it('imports only into an open empty vipolnenie', () => {
    assert.equal(canImportZadanieWorks(ready), true)
    assert.equal(IMPORT_CONFIRM, 'Все существующие работы в выполнении будут удалены, Вы уверены?')
  })

  it('refuses a closed part, any existing work and a locked work', () => {
    assert.equal(canImportZadanieWorks({ ...ready, closed: true }), false)
    assert.equal(canImportZadanieWorks({ ...ready, closed: null }), false)
    assert.equal(canImportZadanieWorks({ ...ready, lockFlags: null }), false)
    assert.equal(canImportZadanieWorks({ ...ready, lockFlags: new Map([['1', 0]]) }), false)
    assert.equal(canImportZadanieWorks({ ...ready, lockFlags: new Map([['1', 1]]) }), false)
    assert.equal(canImportZadanieWorks({ ...ready, pending: true }), false)
  })
})
