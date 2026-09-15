import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  catalogTreeKeepMounted,
  nextCatalogHasOpened,
} from './catalogDialogState.js'

describe('nextCatalogHasOpened', () => {
  it('stays false until the dialog is opened', () => {
    assert.equal(nextCatalogHasOpened(false, false), false)
  })

  it('becomes true on first open', () => {
    assert.equal(nextCatalogHasOpened(false, true), true)
  })

  it('stays true after the dialog is closed so the tree is not remounted', () => {
    assert.equal(nextCatalogHasOpened(true, false), true)
    assert.equal(nextCatalogHasOpened(true, true), true)
  })
})

describe('catalogTreeKeepMounted', () => {
  it('does not keep an unopened dialog mounted', () => {
    assert.equal(catalogTreeKeepMounted(false), false)
  })

  it('keeps the tree mounted after the first open', () => {
    assert.equal(catalogTreeKeepMounted(true), true)
  })
})
