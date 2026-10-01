import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { naryadOperIconName } from './naryadOperIcons.js'

describe('naryadOperIconName', () => {
  it('uses calculator for leaf combination and algorithm', () => {
    assert.equal(naryadOperIconName({ operlifetype: 79, hasChildren: false }), 'calculator')
    assert.equal(naryadOperIconName({ operlifetype: 80, hasChildren: false }), 'calculator')
    assert.equal(naryadOperIconName({ operlifetype: '79' }), 'calculator')
  })

  it('uses the exit-style icon for a leaf experimental work', () => {
    assert.equal(naryadOperIconName({ operlifetype: 82, hasChildren: false }), 'square-arrow-out-up-right')
    assert.equal(naryadOperIconName({ operlifetype: '82' }), 'square-arrow-out-up-right')
  })

  it('uses folder-tree for a parent with a type, including 79, 80 and 82', () => {
    assert.equal(naryadOperIconName({ operlifetype: 79, hasChildren: true }), 'folder-tree')
    assert.equal(naryadOperIconName({ operlifetype: 80, hasChildren: true }), 'folder-tree')
    assert.equal(naryadOperIconName({ operlifetype: 82, hasChildren: true }), 'folder-tree')
    assert.equal(naryadOperIconName({ operlifetype: 78, hasChildren: true }), 'folder-tree')
  })

  it('draws nothing for a block, a constant leaf, or a missing node', () => {
    assert.equal(naryadOperIconName({ operlifetype: null, hasChildren: true }), null)
    assert.equal(naryadOperIconName({ operlifetype: '', hasChildren: false }), null)
    assert.equal(naryadOperIconName({ operlifetype: 78, hasChildren: false }), null)
    assert.equal(naryadOperIconName({ operlifetype: 81, hasChildren: false }), null)
    assert.equal(naryadOperIconName(null), null)
    assert.equal(naryadOperIconName(undefined), null)
  })

  it('ignores lock and correlation', () => {
    assert.equal(
      naryadOperIconName({ operlifetype: 79, hasChildren: false, locked: 1, kor: 1 }),
      'calculator',
    )
  })
})
