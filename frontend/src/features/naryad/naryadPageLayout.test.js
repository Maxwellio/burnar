import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import {
  NARYAD_CELL_PADDING_Y,
  SPLIT_PANE_MIN,
  SPLIT_RATIO_DEFAULT,
  clampSplitFirstPane,
  naryadCompactTableSx,
  persistTableColumnSizing,
  readStoredRightPanelWidth,
  readStoredSplitOrientation,
  readStoredSplitRatio,
  seedTableColumnSizing,
  tableColumnSizingUrlKey,
  writeStoredRightPanelWidth,
  writeStoredSplitOrientation,
  writeStoredSplitRatio,
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

describe('split orientation', () => {
  it('defaults to vertical', () => {
    assert.equal(readStoredSplitOrientation(), 'vertical')
  })

  it('writes and reads horizontal', () => {
    writeStoredSplitOrientation('horizontal')
    assert.equal(readStoredSplitOrientation(), 'horizontal')
  })

  it('ignores an unknown value and keeps the previous one', () => {
    writeStoredSplitOrientation('horizontal')
    writeStoredSplitOrientation('diagonal')
    assert.equal(readStoredSplitOrientation(), 'horizontal')
  })

  it('falls back to vertical when storage has an unknown value', () => {
    localStorage.setItem('naryad-split-orientation', 'diagonal')
    assert.equal(readStoredSplitOrientation(), 'vertical')
  })
})

describe('split ratio', () => {
  it('defaults each orientation to half', () => {
    assert.equal(SPLIT_RATIO_DEFAULT, 0.5)
    assert.equal(readStoredSplitRatio('vertical'), 0.5)
    assert.equal(readStoredSplitRatio('horizontal'), 0.5)
  })

  it('stores vertical and horizontal shares apart', () => {
    writeStoredSplitRatio('vertical', 0.35)
    writeStoredSplitRatio('horizontal', 0.7)
    assert.equal(readStoredSplitRatio('vertical'), 0.35)
    assert.equal(readStoredSplitRatio('horizontal'), 0.7)
  })

  it('ignores a share that would hide a pane', () => {
    writeStoredSplitRatio('vertical', 0.4)
    writeStoredSplitRatio('vertical', 0)
    writeStoredSplitRatio('vertical', 1)
    assert.equal(readStoredSplitRatio('vertical'), 0.4)
  })

  it('falls back to half when storage is not a share', () => {
    localStorage.setItem('naryad-split-ratio:vertical', 'wide')
    assert.equal(readStoredSplitRatio('vertical'), 0.5)
  })

  it('keeps each pane at least 240 px', () => {
    assert.equal(SPLIT_PANE_MIN, 240)
    const wide = 1000
    assert.equal(clampSplitFirstPane(0.1, wide), 240)
    assert.equal(clampSplitFirstPane(0.9, wide), wide - 6 - 240)
    assert.equal(clampSplitFirstPane(0.5, wide), Math.round((wide - 6) * 0.5))
  })

  it('splits the remainder when both minimums do not fit', () => {
    assert.equal(clampSplitFirstPane(0.2, 400), Math.floor((400 - 6) / 2))
  })

  it('returns nothing until the container is measured', () => {
    assert.equal(clampSplitFirstPane(0.5, 0), null)
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

describe('compact naryad cells', () => {
  it('uses less vertical padding than the package py-2 (8px)', () => {
    const padding = Number.parseFloat(NARYAD_CELL_PADDING_Y)
    assert.ok(padding < 8)
    assert.equal(naryadCompactTableSx['& th, & td'].paddingTop, NARYAD_CELL_PADDING_Y)
    assert.equal(naryadCompactTableSx['& th, & td'].paddingBottom, NARYAD_CELL_PADDING_Y)
  })
})
