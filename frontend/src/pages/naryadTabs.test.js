import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { initialOpenPanels, toggleOpenPanels } from './naryadTabs.js'

describe('initialOpenPanels', () => {
  it('opens both when defnarzad and defnarvip exist', () => {
    assert.deepEqual(
      initialOpenPanels({ hasZadanie: true, hasVipolnenie: true }),
      ['zad', 'vip'],
    )
  })

  it('opens only zadanie when only defnarzad exists', () => {
    assert.deepEqual(
      initialOpenPanels({ hasZadanie: true, hasVipolnenie: false }),
      ['zad'],
    )
  })

  it('opens only vipolnenie when only defnarvip exists', () => {
    assert.deepEqual(
      initialOpenPanels({ hasZadanie: false, hasVipolnenie: true }),
      ['vip'],
    )
  })

  it('falls back to zadanie when neither descriptor exists', () => {
    assert.deepEqual(
      initialOpenPanels({ hasZadanie: false, hasVipolnenie: false }),
      ['zad'],
    )
  })
})

describe('toggleOpenPanels', () => {
  it('keeps the last remaining panel', () => {
    assert.deepEqual(toggleOpenPanels(['zad'], []), ['zad'])
    assert.deepEqual(toggleOpenPanels(['vip'], null), ['vip'])
  })

  it('allows opening the second panel and keeps zad left of vip', () => {
    assert.deepEqual(toggleOpenPanels(['zad'], ['vip', 'zad']), ['zad', 'vip'])
  })

  it('allows closing one panel when both are open', () => {
    assert.deepEqual(toggleOpenPanels(['zad', 'vip'], ['vip']), ['vip'])
  })
})
