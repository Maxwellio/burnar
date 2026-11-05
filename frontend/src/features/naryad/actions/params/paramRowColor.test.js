import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { paramRowBackground } from './paramRowColor.js'

describe('paramRowBackground', () => {
  it('paints a matching through-parameter light green', () => {
    assert.equal(paramRowBackground({ isSkv: 14811101 }), '#ddffe1')
  })

  it('paints a different through-parameter light red', () => {
    assert.equal(paramRowBackground({ isSkv: 11777023 }), '#ffb3b3')
  })

  it('leaves a row alone when there is no through-parameter', () => {
    assert.equal(paramRowBackground({ isSkv: 0 }), undefined)
    assert.equal(paramRowBackground({}), undefined)
    assert.equal(paramRowBackground(null), undefined)
    assert.equal(paramRowBackground(undefined), undefined)
  })
})
