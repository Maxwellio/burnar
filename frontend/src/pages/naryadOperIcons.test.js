import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  naryadCorrelationIconName,
  naryadLockIconName,
  naryadOperIconName,
} from './naryadOperIcons.js'

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

  it('keeps the name icon when the row is also locked or correlated', () => {
    assert.equal(
      naryadOperIconName({ operlifetype: 79, hasChildren: false, locked: 1, kor: 1 }),
      'calculator',
    )
  })
})

describe('naryadCorrelationIconName', () => {
  it('uses bell on a typed leaf with kor = 1', () => {
    assert.equal(naryadCorrelationIconName({ operlifetype: 79, hasChildren: false, kor: 1 }), 'bell')
    assert.equal(naryadCorrelationIconName({ operlifetype: 82, hasChildren: false, kor: '1' }), 'bell')
    assert.equal(naryadCorrelationIconName({ operlifetype: 78, hasChildren: false, kor: 1 }), 'bell')
  })

  it('skips a parent, a block, and a leaf without a rule', () => {
    assert.equal(naryadCorrelationIconName({ operlifetype: 79, hasChildren: true, kor: 1 }), null)
    assert.equal(naryadCorrelationIconName({ operlifetype: null, hasChildren: false, kor: 1 }), null)
    assert.equal(naryadCorrelationIconName({ operlifetype: 80, hasChildren: false, kor: 0 }), null)
    assert.equal(naryadCorrelationIconName(null), null)
  })
})

describe('naryadLockIconName', () => {
  it('uses link-2 for any locked row', () => {
    assert.equal(naryadLockIconName({ operlifetype: 79, hasChildren: false, locked: 1 }), 'link-2')
    assert.equal(naryadLockIconName({ operlifetype: 79, hasChildren: true, locked: '1' }), 'link-2')
    assert.equal(naryadLockIconName({ operlifetype: null, hasChildren: true, locked: 1 }), 'link-2')
  })

  it('draws nothing when the row is unlocked or missing', () => {
    assert.equal(naryadLockIconName({ locked: 0 }), null)
    assert.equal(naryadLockIconName({ locked: null }), null)
    assert.equal(naryadLockIconName(null), null)
  })
})
