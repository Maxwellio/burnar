import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  detailNodeId,
  formatDuration,
  nodeIdFilters,
  selectedNodeStatusText,
  treeFooterStatusItems,
  treeFooterStatusText,
  treeSelectionStatusText,
} from './naryadWorkspaceData.js'

describe('nodeIdFilters', () => {
  it('is empty without a selected row', () => {
    assert.deepEqual(nodeIdFilters(null), [])
    assert.deepEqual(nodeIdFilters(undefined), [])
    assert.deepEqual(nodeIdFilters(''), [])
  })

  it('sends nodeId when a tree row is selected', () => {
    assert.deepEqual(nodeIdFilters(42), [{ id: 'nodeId', value: '42' }])
    assert.deepEqual(nodeIdFilters('99'), [{ id: 'nodeId', value: '99' }])
  })
})

describe('selectedNodeStatusText', () => {
  it('is blank without a selected row', () => {
    assert.equal(selectedNodeStatusText(null), '')
    assert.equal(selectedNodeStatusText(undefined), '')
    assert.equal(selectedNodeStatusText(''), '')
  })

  it('formats numeric and string IDs', () => {
    assert.equal(selectedNodeStatusText(42), 'Код: 42')
    assert.equal(selectedNodeStatusText('99'), 'Код: 99')
  })
})

describe('detailNodeId', () => {
  it('returns the only selected row', () => {
    assert.equal(detailNodeId([42]), 42)
    assert.equal(detailNodeId(['99']), '99')
  })

  it('is empty when several rows are selected so the detail panel stays blank', () => {
    assert.equal(detailNodeId([1, 2]), null)
    assert.equal(detailNodeId([]), null)
    assert.equal(detailNodeId(null), null)
    assert.deepEqual(nodeIdFilters(detailNodeId([1, 2])), [])
  })
})

describe('treeSelectionStatusText', () => {
  it('is blank without a selection', () => {
    assert.equal(treeSelectionStatusText([]), '')
    assert.equal(treeSelectionStatusText(null), '')
  })

  it('shows the code of a single row and the count of several rows', () => {
    assert.equal(treeSelectionStatusText([42]), 'Код: 42')
    assert.equal(treeSelectionStatusText([1, 2, 3]), 'Выбрано: 3')
  })
})

describe('formatDuration', () => {
  it('shows zero for an empty total and trims trailing hundredths', () => {
    assert.equal(formatDuration(null), '0')
    assert.equal(formatDuration(0), '0')
    assert.equal(formatDuration('12.50'), '12.5')
    assert.equal(formatDuration(3), '3')
    assert.equal(formatDuration(1.2), '1.2')
  })
})

describe('treeFooterStatusItems', () => {
  it('puts a divider before every chunk after the first', () => {
    assert.deepEqual(
      treeFooterStatusItems([42], 'vipolnenie', { normDuration: 8, factDuration: 3.25 }),
      [
        { text: 'Код: 42', divider: false },
        { text: 'Общая нормативная продолжительность: 8', divider: true },
        { text: 'Общая фактическая продолжительность: 3.25', divider: true },
      ],
    )
  })

  it('has no divider when the footer is a single total', () => {
    assert.deepEqual(
      treeFooterStatusItems([], 'zadanie', { duration: 4.5 }),
      [{ text: 'Общая продолжительность: 4.5', divider: false }],
    )
  })
})

describe('treeFooterStatusText', () => {
  it('shows the assignment total even when nothing is selected', () => {
    assert.equal(
      treeFooterStatusText([], 'zadanie', { duration: 4.5 }),
      'Общая продолжительность: 4.5',
    )
  })

  it('places both execution totals after the selected row code', () => {
    assert.equal(
      treeFooterStatusText([42], 'vipolnenie', { normDuration: 8, factDuration: 3.25 }),
      'Код: 42    Общая нормативная продолжительность: 8    Общая фактическая продолжительность: 3.25',
    )
  })

  it('keeps the selection count ahead of the totals', () => {
    assert.equal(
      treeFooterStatusText([1, 2], 'zadanie', { duration: 0 }),
      'Выбрано: 2    Общая продолжительность: 0',
    )
  })
})
