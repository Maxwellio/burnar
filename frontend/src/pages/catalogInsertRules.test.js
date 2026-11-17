import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CATALOG_BEFORE_LOCKED_MESSAGE,
  canInsertFromCatalog,
  canUseCatalogPlace,
  catalogDateFromPicker,
  catalogPlaceChoices,
  catalogTreeEmpty,
  defaultCatalogDateIso,
  isCatalogSection,
  needsEmptyBlockPlacePrompt,
  normalizeCatalogPlace,
  resolveCatalogAnchor,
  resolveEmptyBlockPlace,
} from './catalogInsertRules.js'

describe('catalogInsertRules', () => {
  it('formats date-only ISO at start of day', () => {
    assert.equal(defaultCatalogDateIso(new Date(2026, 10, 16, 15, 40, 12)), '2026-11-16T00:00:00')
    assert.equal(catalogDateFromPicker(new Date(2026, 0, 5, 23, 15)), '2026-01-05T00:00:00')
  })

  it('treats catalog section vs operation and unknown oper', () => {
    assert.equal(isCatalogSection({ id: 1, oper: null }), true)
    assert.equal(isCatalogSection({ id: 1, oper: 44 }), false)
    assert.equal(isCatalogSection({ id: 1 }), false)
  })

  it('requires date, catalog node and open part', () => {
    const base = {
      dateIn: '2026-11-16T00:00:00',
      catalogNode: { id: 2, oper: null },
      mode: 'full',
      partClosed: false,
      hasPart: true,
      pending: false,
      treeEmpty: true,
      anchor: null,
    }
    assert.equal(canInsertFromCatalog(base), true)
    assert.equal(canInsertFromCatalog({ ...base, dateIn: null }), false)
    assert.equal(canInsertFromCatalog({ ...base, mode: 'empty', catalogNode: { id: 2, oper: 9 } }), false)
    assert.equal(canInsertFromCatalog({ ...base, mode: 'empty', catalogNode: { id: 2 } }), false)
    assert.equal(canInsertFromCatalog({ ...base, treeEmpty: false, anchor: null }), false)
    assert.equal(canInsertFromCatalog({ ...base, hasPart: false }), false)
    assert.equal(canInsertFromCatalog({ ...base, mode: 'full', catalogNode: { id: 2 } }), true)
  })

  it('disables end/inside on operation anchors and before on locked', () => {
    const block = { id: 10, parentId: null, prnum: 1, operlifetype: null, locked: 0, hasChildren: true }
    const work = { id: 11, parentId: 10, prnum: 1, operlifetype: 80, locked: 0, hasChildren: false }
    const locked = { ...work, locked: 1 }
    assert.equal(canUseCatalogPlace('end', { treeEmpty: false, anchor: { id: 10, node: block } }), true)
    assert.equal(canUseCatalogPlace('inside', { treeEmpty: false, anchor: { id: 10, node: block } }), true)
    assert.equal(canUseCatalogPlace('end', { treeEmpty: false, anchor: { id: 11, node: work } }), false)
    assert.equal(canUseCatalogPlace('inside', { treeEmpty: false, anchor: { id: 11, node: work } }), false)
    assert.equal(canUseCatalogPlace('before', {
      treeEmpty: false,
      anchor: { id: 11, node: locked },
      refuseLocked: true,
    }), false)
    assert.equal(catalogPlaceChoices({
      treeEmpty: false,
      anchor: { id: 11, node: work },
      refuseLocked: true,
    }).map((item) => item.result).join(','), 'before,after')
    assert.equal(catalogPlaceChoices({
      treeEmpty: false,
      anchor: { id: 10, node: block },
      refuseLocked: false,
    }).map((item) => item.result).join(','), 'before,after,inside,end')
  })

  it('prompts only for empty block before', () => {
    const empty = { id: 5, parentId: 1, prnum: 1, operlifetype: null, locked: 0, hasChildren: false }
    const filled = { ...empty, hasChildren: true }
    assert.equal(needsEmptyBlockPlacePrompt('before', { id: 5, node: empty }, false), true)
    assert.equal(needsEmptyBlockPlacePrompt('before', { id: 5, node: filled }, false), false)
    assert.equal(needsEmptyBlockPlacePrompt('after', { id: 5, node: empty }, false), false)
    assert.equal(resolveEmptyBlockPlace(true), 'inside')
    assert.equal(resolveEmptyBlockPlace(false), 'before')
    assert.equal(resolveEmptyBlockPlace(null), null)
  })

  it('resolves anchor from single selection', () => {
    const structure = new Map([[12, { id: 12, operlifetype: 80 }]])
    assert.deepEqual(resolveCatalogAnchor([12], structure), { id: 12, node: structure.get(12) })
    assert.equal(resolveCatalogAnchor([12, 13], structure), null)
    assert.equal(catalogTreeEmpty(new Map()), true)
    assert.equal(normalizeCatalogPlace(' END '), 'end')
    assert.equal(CATALOG_BEFORE_LOCKED_MESSAGE.includes('заблокированной'), true)
  })
})
