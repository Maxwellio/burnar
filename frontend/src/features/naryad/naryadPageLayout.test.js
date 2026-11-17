import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import {
  NARYAD_CELL_PADDING_Y,
  naryadCompactTableSx,
  clampSplitRatio,
  firstPaneFlex,
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
  it('defaults to an empty store', () => {
    assert.equal(readStoredSplitRatio(), null)
  })

  it('writes and reads a ratio between the panes', () => {
    writeStoredSplitRatio(0.7)
    assert.equal(readStoredSplitRatio(), 0.7)
  })

  it('ignores a ratio outside (0, 1)', () => {
    writeStoredSplitRatio(0.35)
    writeStoredSplitRatio(0)
    writeStoredSplitRatio(1)
    writeStoredSplitRatio(1.2)
    assert.equal(readStoredSplitRatio(), 0.35)
  })

  it('keeps the preferred ratio when the container size is unknown', () => {
    assert.equal(clampSplitRatio(0.7, 0), 0.7)
    assert.equal(clampSplitRatio(null, 0), 0.5)
  })

  it('keeps both panes at least 240px', () => {
    assert.equal(clampSplitRatio(0.1, 1000), 0.24)
    assert.equal(clampSplitRatio(0.9, 1000), 0.76)
  })

  it('locks the split at half when the container cannot fit two minima', () => {
    assert.equal(clampSplitRatio(0.2, 400), 0.5)
  })

  it('builds the first pane flex from the ratio and the splitter thickness', () => {
    assert.equal(firstPaneFlex(0.5), '0 0 calc((100% - 6px) * 0.5)')
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
