import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getTreeStatusBarParts, isTreeStatusBarVisible } from './treeStatusBar.js'

describe('isTreeStatusBarVisible', () => {
  it('hides the footer when statusBar is omitted', () => {
    assert.equal(isTreeStatusBarVisible(undefined), false)
    assert.equal(isTreeStatusBarVisible(null), false)
  })

  it('shows the footer when statusBar is passed, even with no fields', () => {
    assert.equal(isTreeStatusBarVisible({}), true)
    assert.equal(isTreeStatusBarVisible({ selectedId: false }), true)
  })
})

describe('getTreeStatusBarParts', () => {
  it('renders nothing without a statusBar object', () => {
    assert.deepEqual(getTreeStatusBarParts(undefined, { selectedRowId: 12 }), [])
  })

  it('omits Код when the selectedId flag is off', () => {
    assert.deepEqual(getTreeStatusBarParts({}, { selectedRowId: 12 }), [])
    assert.deepEqual(getTreeStatusBarParts({ selectedId: false }, { selectedRowId: 12 }), [])
  })

  it('omits Код when the flag is on but no row is selected', () => {
    assert.deepEqual(getTreeStatusBarParts({ selectedId: true }, {}), [])
    assert.deepEqual(getTreeStatusBarParts({ selectedId: true }, { selectedRowId: null }), [])
    assert.deepEqual(getTreeStatusBarParts({ selectedId: true }, { selectedRowId: '' }), [])
  })

  it('renders Код for the selected row id', () => {
    assert.deepEqual(getTreeStatusBarParts({ selectedId: true }, { selectedRowId: 42 }), ['Код: 42'])
    assert.deepEqual(getTreeStatusBarParts({ selectedId: true }, { selectedRowId: 0 }), ['Код: 0'])
    assert.deepEqual(getTreeStatusBarParts({ selectedId: true }, { selectedRowId: '99' }), ['Код: 99'])
  })
})
