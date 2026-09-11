import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import {
  persistTableColumnSizing,
  readStoredRightPanelWidth,
  seedTableColumnSizing,
  tableColumnSizingUrlKey,
  writeStoredRightPanelWidth,
} from './naryadPageLayout.js'

function installMemoryStorage() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value))
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
  return store
}

beforeEach(() => {
  installMemoryStorage()
})

describe('right panel width', () => {
  it('writes and reads a per-tab key', () => {
    writeStoredRightPanelWidth(320, 'naryad-right-panel-width:zad')
    assert.equal(readStoredRightPanelWidth('naryad-right-panel-width:zad'), 320)
  })

  it('falls back to the legacy shared key', () => {
    localStorage.setItem('naryad-right-panel-width', '280')
    assert.equal(readStoredRightPanelWidth('naryad-right-panel-width:zad'), 280)
  })

  it('prefers the per-tab key over the legacy key', () => {
    localStorage.setItem('naryad-right-panel-width', '280')
    writeStoredRightPanelWidth(360, 'naryad-right-panel-width:zad')
    assert.equal(readStoredRightPanelWidth('naryad-right-panel-width:zad'), 360)
  })
})

describe('table column sizing', () => {
  it('seeds BaseTable url key from the stable layout key', () => {
    const url = '/naryady/7/zadanie'
    const stableKey = 'naryad-column-sizing:zadanie-tree'
    localStorage.setItem(stableKey, JSON.stringify({ zad_nm: 300 }))

    seedTableColumnSizing(url, stableKey)

    assert.deepEqual(JSON.parse(localStorage.getItem(tableColumnSizingUrlKey(url))), {
      zad_nm: 300,
    })
  })

  it('copies first url sizing into the stable key when stable is empty', () => {
    const url = '/naryady/7/zadanie'
    const stableKey = 'naryad-column-sizing:zadanie-tree'
    localStorage.setItem(tableColumnSizingUrlKey(url), JSON.stringify({ zad_nm: 220 }))

    seedTableColumnSizing(url, stableKey)

    assert.deepEqual(JSON.parse(localStorage.getItem(stableKey)), { zad_nm: 220 })
  })

  it('persists url sizing back to the stable key', () => {
    const url = '/naryady/9/vipolnenie'
    const stableKey = 'naryad-column-sizing:vipolnenie-tree'
    localStorage.setItem(tableColumnSizingUrlKey(url), JSON.stringify({ vip_nm: 310 }))

    persistTableColumnSizing(url, stableKey)

    assert.deepEqual(JSON.parse(localStorage.getItem(stableKey)), { vip_nm: 310 })
  })

  it('does not overwrite a stable key with empty url sizing', () => {
    const url = '/naryady/9/vipolnenie'
    const stableKey = 'naryad-column-sizing:vipolnenie-tree'
    localStorage.setItem(stableKey, JSON.stringify({ vip_nm: 310 }))
    localStorage.setItem(tableColumnSizingUrlKey(url), JSON.stringify({}))

    persistTableColumnSizing(url, stableKey)

    assert.deepEqual(JSON.parse(localStorage.getItem(stableKey)), { vip_nm: 310 })
  })
})
