import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { expandedChildRequests, indexTreeNodes } from './restoreExpandedChildren.js'

const root = (id, extra = {}) => ({ id, hasChildren: true, ...extra })

describe('expandedChildRequests', () => {
  it('requests an expanded root that came back without children', () => {
    const nodes = indexTreeNodes([root(10)])
    assert.deepEqual(
      expandedChildRequests(['10'], nodes, new Set()),
      { requestIds: [10], pending: true },
    )
  })

  it('waits for the parent before requesting an expanded child that is not loaded yet', () => {
    const nodes = indexTreeNodes([root(10)])
    assert.deepEqual(
      expandedChildRequests(['10', '20'], nodes, new Set()),
      { requestIds: [10], pending: true },
    )
  })

  it('requests the expanded child once its parent is in the tree', () => {
    const nodes = indexTreeNodes([
      root(10, { children: [root(20)], hasLoaded: true }),
    ])
    assert.deepEqual(
      expandedChildRequests(['10', '20'], nodes, new Set()),
      { requestIds: [20], pending: true },
    )
  })

  it('does not repeat a request that is already in flight', () => {
    const nodes = indexTreeNodes([root(10)])
    assert.deepEqual(
      expandedChildRequests(['10'], nodes, new Set(['10'])),
      { requestIds: [], pending: true },
    )
  })

  it('finishes when every expanded node already has its children or is gone', () => {
    const nodes = indexTreeNodes([
      root(10, { children: [root(20, { children: [], hasLoaded: true })], hasLoaded: true }),
      { id: 30, hasChildren: false },
    ])
    assert.deepEqual(
      expandedChildRequests(['10', '20', '30', '40'], nodes, new Set()),
      { requestIds: [], pending: false },
    )
  })
})
