import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  buildTreeExpandFilters,
  expandTokenAfterTableFilters,
  nextExpandToken,
} from './treeExpandFilters.js'

describe('tree expand filters', () => {
  it('sends no expandAll until the button is used', () => {
    assert.deepEqual(buildTreeExpandFilters(null), [])
  })

  it('sends expandAll as the query the tree packet already understands', () => {
    assert.deepEqual(buildTreeExpandFilters(1), [{ id: 'expandAll', value: '1' }])
    assert.deepEqual(buildTreeExpandFilters(4), [{ id: 'expandAll', value: '4' }])
  })

  it('counts the next reveal from zero', () => {
    assert.equal(nextExpandToken(null), 1)
    assert.equal(nextExpandToken(3), 4)
  })

  it('drops the token when the table clears filters', () => {
    assert.equal(expandTokenAfterTableFilters(2, []), null)
  })

  it('keeps the token when the table echoes expandAll', () => {
    assert.equal(
      expandTokenAfterTableFilters(2, [{ id: 'expandAll', value: '2' }]),
      2,
    )
  })
})

describe('catalog insert stays wired on the naryad page', () => {
  it('passes the current row of each part into the catalog', () => {
    const src = readFileSync(new URL('../NaryadPage.jsx', import.meta.url), 'utf8')
    assert.match(src, /onCatalogTargetChange=\{handleCatalogTargetChange\}/)
    assert.match(src, /zadanieTarget=\{\{/)
    assert.match(src, /vipolnenieTarget=\{\{/)
    assert.match(src, /available: hasVipolnenie/)
    assert.match(src, /onInserted=/)
  })

  it('keys the catalog and the global params dialog differently', () => {
    const src = readFileSync(new URL('../NaryadPage.jsx', import.meta.url), 'utf8')
    assert.match(src, /key=\{`catalog-\$\{id\}`\}/)
    assert.match(src, /key=\{`global-\$\{id\}`\}/)
    assert.doesNotMatch(src, /key=\{id\}/)
  })
})

describe('expand buttons sit second, after cross parameters', () => {
  for (const file of ['zadaniePart.js', 'vipolneniePart.js']) {
    it(file, () => {
      const src = readFileSync(new URL(`../parts/${file}`, import.meta.url), 'utf8')
      const actions = src.slice(src.indexOf('actions: ['), src.indexOf('],'))
      const names = [...actions.matchAll(/(\w+),/g)].map((match) => match[1])
      assert.deepEqual(names.slice(0, 3), [
        'openSkvParamsAction',
        'expandAllNodesAction',
        'collapseAllNodesAction',
      ])
    })
  }
})
