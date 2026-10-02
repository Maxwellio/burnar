import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  nodeIdFilters,
  selectedNodeStatusText,
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
