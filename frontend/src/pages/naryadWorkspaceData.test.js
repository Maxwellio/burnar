import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nodeIdFilters } from './naryadWorkspaceData.js'

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
