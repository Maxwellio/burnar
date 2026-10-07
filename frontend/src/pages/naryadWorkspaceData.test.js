import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  detailNodeId,
  nodeIdFilters,
  selectedNodeStatusText,
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
