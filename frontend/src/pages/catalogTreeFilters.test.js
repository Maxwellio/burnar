import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EXPAND_ALL_FILTER_ID,
  applyCatalogFilterChange,
  buildCatalogTableFilters,
} from './catalogTreeFilters.js'

describe('buildCatalogTableFilters', () => {
  it('passes column filters through when the tree is not expand-all', () => {
    const filters = [{ id: 'name', value: 'бур' }]
    assert.deepEqual(buildCatalogTableFilters(filters, null), filters)
    assert.notEqual(buildCatalogTableFilters(filters, null), filters)
  })

  it('appends expandAll when a token is set', () => {
    assert.deepEqual(buildCatalogTableFilters([{ id: 'name', value: 'бур' }], 3), [
      { id: 'name', value: 'бур' },
      { id: EXPAND_ALL_FILTER_ID, value: '3' },
    ])
  })
})

describe('applyCatalogFilterChange', () => {
  it('strips expandAll from the next column filters', () => {
    const result = applyCatalogFilterChange({
      prevFilters: [{ id: 'name', value: 'бур' }],
      expandToken: 1,
      updater: [
        { id: 'name', value: 'бур' },
        { id: EXPAND_ALL_FILTER_ID, value: '1' },
        { id: 'oper', value: '10' },
      ],
    })
    assert.deepEqual(result.filters, [
      { id: 'name', value: 'бур' },
      { id: 'oper', value: '10' },
    ])
    assert.equal(result.expandToken, 1)
  })

  it('accepts a functional updater that sees expandAll in the current filters', () => {
    let seen
    const result = applyCatalogFilterChange({
      prevFilters: [{ id: 'name', value: 'бур' }],
      expandToken: 2,
      updater: (current) => {
        seen = current
        return current.filter((f) => f.id === 'name')
      },
    })
    assert.deepEqual(seen, [
      { id: 'name', value: 'бур' },
      { id: EXPAND_ALL_FILTER_ID, value: '2' },
    ])
    assert.deepEqual(result.filters, [{ id: 'name', value: 'бур' }])
    assert.equal(result.expandToken, 2)
  })

  it('clears expandAll when all column filters are cleared', () => {
    const result = applyCatalogFilterChange({
      prevFilters: [{ id: 'name', value: 'бур' }],
      expandToken: 4,
      updater: [],
    })
    assert.deepEqual(result.filters, [])
    assert.equal(result.expandToken, null)
  })

  it('does not clear expandAll when column filters remain', () => {
    const result = applyCatalogFilterChange({
      prevFilters: [{ id: 'name', value: 'бур' }],
      expandToken: 4,
      updater: [{ id: 'name', value: 'скв' }],
    })
    assert.equal(result.expandToken, 4)
  })

  it('treats blank filter values as inactive', () => {
    const result = applyCatalogFilterChange({
      prevFilters: [{ id: 'name', value: 'бур' }],
      expandToken: 1,
      updater: [{ id: 'name', value: '  ' }],
    })
    assert.equal(result.expandToken, null)
  })
})
