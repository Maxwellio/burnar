import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nextTreeSelection } from './rowSelection.js'

const visibleIds = ['1', '2', '3', '4', '5']

function select(overrides) {
  return nextTreeSelection({
    visibleIds,
    selectedIds: [],
    anchorId: null,
    clickedId: '1',
    shiftKey: false,
    toggleKey: false,
    ...overrides,
  })
}

describe('nextTreeSelection', () => {
  it('replaces the selection on a plain click and moves the anchor', () => {
    assert.deepEqual(select({ selectedIds: ['3', '4'], anchorId: '3', clickedId: '1' }), {
      selectedIds: ['1'],
      anchorId: '1',
    })
  })

  it('toggles one row with ctrl or cmd and keeps visible order', () => {
    assert.deepEqual(select({
      selectedIds: ['3'],
      anchorId: '3',
      clickedId: '1',
      toggleKey: true,
    }), {
      selectedIds: ['1', '3'],
      anchorId: '1',
    })
  })

  it('removes a toggled row and can leave the selection empty', () => {
    assert.deepEqual(select({
      selectedIds: ['3', '4'],
      anchorId: '4',
      clickedId: '3',
      toggleKey: true,
    }), {
      selectedIds: ['4'],
      anchorId: '3',
    })
    assert.deepEqual(select({
      selectedIds: ['3'],
      anchorId: '3',
      clickedId: '3',
      toggleKey: true,
    }), {
      selectedIds: [],
      anchorId: '3',
    })
  })

  it('keeps a selected row that is no longer visible when toggling another row', () => {
    assert.deepEqual(select({
      selectedIds: ['1', '9'],
      anchorId: '1',
      clickedId: '2',
      toggleKey: true,
    }), {
      selectedIds: ['1', '2', '9'],
      anchorId: '2',
    })
  })

  it('selects the inclusive visible range on shift click without moving the anchor', () => {
    assert.deepEqual(select({
      selectedIds: ['2'],
      anchorId: '2',
      clickedId: '5',
      shiftKey: true,
    }), {
      selectedIds: ['2', '3', '4', '5'],
      anchorId: '2',
    })
    assert.deepEqual(select({
      selectedIds: ['4'],
      anchorId: '4',
      clickedId: '2',
      shiftKey: true,
    }), {
      selectedIds: ['2', '3', '4'],
      anchorId: '4',
    })
  })

  it('adds the visible range to the current selection on ctrl+shift', () => {
    assert.deepEqual(select({
      selectedIds: ['5'],
      anchorId: '2',
      clickedId: '4',
      shiftKey: true,
      toggleKey: true,
    }), {
      selectedIds: ['2', '3', '4', '5'],
      anchorId: '2',
    })
  })

  it('drops hidden rows when shift replaces the selection with a visible range', () => {
    assert.deepEqual(select({
      selectedIds: ['1', '9'],
      anchorId: '1',
      clickedId: '3',
      shiftKey: true,
    }), {
      selectedIds: ['1', '2', '3'],
      anchorId: '1',
    })
  })

  it('treats shift without a visible anchor as a plain click', () => {
    assert.deepEqual(select({
      selectedIds: ['2', '9'],
      anchorId: '9',
      clickedId: '4',
      shiftKey: true,
    }), {
      selectedIds: ['4'],
      anchorId: '4',
    })
    assert.deepEqual(select({
      clickedId: '3',
      shiftKey: true,
    }), {
      selectedIds: ['3'],
      anchorId: '3',
    })
  })
})
