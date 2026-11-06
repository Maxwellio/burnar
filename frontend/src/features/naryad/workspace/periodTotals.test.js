import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PERIOD_TOTALS_MIN_HEIGHT,
  PERIOD_TOTALS_PANEL_HEIGHT,
  PERIOD_TOTAL_COLUMNS,
  clampPeriodTotalsHeight,
  formatPeriodHours,
  periodTotalColumnDefs,
  readStoredPeriodTotalsHeight,
  writeStoredPeriodTotalsHeight,
  initialPeriodTotalsState,
  periodTotalsFailed,
  periodTotalsSucceeded,
  reloadPeriodTotals,
  togglePeriodTotals,
} from './periodTotals.js'

describe('formatPeriodHours', () => {
  it('leaves an empty value blank', () => {
    assert.equal(formatPeriodHours(null), '')
    assert.equal(formatPeriodHours(undefined), '')
    assert.equal(formatPeriodHours(''), '')
  })

  it('shows a real zero with two decimals', () => {
    assert.equal(formatPeriodHours(0), '0.00')
  })

  it('keeps two decimals for a finite number', () => {
    assert.equal(formatPeriodHours(8), '8.00')
    assert.equal(formatPeriodHours(1.2), '1.20')
    assert.equal(formatPeriodHours('3.256'), '3.26')
  })
})

describe('PERIOD_TOTAL_COLUMNS', () => {
  it('shows the period name and the six Delphi sums', () => {
    assert.deepEqual(
      PERIOD_TOTAL_COLUMNS.map((column) => column.title),
      [
        'Название периода',
        'Итог Н.В.',
        'Итог Факт.',
        'Сумма Н.В.',
        'Ремонт Н.В.',
        'Сумма Факт.',
        'Ремонт Факт.',
      ],
    )
    assert.deepEqual(
      PERIOD_TOTAL_COLUMNS.map((column) => column.id),
      ['name', 'summN', 'summF', 'normativ', 'remontN', 'fact', 'remontF'],
    )
  })
})

describe('periodTotalColumnDefs', () => {
  it('matches BaseTable columns of the naryad card and hides filters', () => {
    const columns = periodTotalColumnDefs()
    assert.deepEqual(
      columns.map((column) => column.accessorKey),
      PERIOD_TOTAL_COLUMNS.map((column) => column.id),
    )
    assert.deepEqual(
      columns.map((column) => column.header),
      PERIOD_TOTAL_COLUMNS.map((column) => column.title),
    )
    assert.ok(columns.every((column) => column.id.startsWith('period_')))
    assert.ok(columns.every((column) => column.enableColumnFilter === false))
    assert.ok(columns.every((column) => column.maxSize === 4000))
    const factTotal = columns.find((column) => column.accessorKey === 'summF')
    assert.equal(factTotal.cell({ getValue: () => null }), '')
    assert.equal(factTotal.cell({ getValue: () => 0 }), '0.00')
    const name = columns.find((column) => column.accessorKey === 'name')
    assert.equal(name.cell({ getValue: () => null }), '')
    assert.equal(name.cell({ getValue: () => 'Январь' }), 'Январь')
  })
})

describe('period totals panel state', () => {
  it('opens a closed panel and asks for the first load', () => {
    const next = togglePeriodTotals(initialPeriodTotalsState())
    assert.equal(next.fetch, true)
    assert.deepEqual(next.state, { open: true, loaded: false, loading: true })
  })

  it('closes an open panel without another read', () => {
    const open = periodTotalsSucceeded({ open: true, loaded: false, loading: true })
    const next = togglePeriodTotals(open)
    assert.equal(next.fetch, false)
    assert.equal(next.state.open, false)
    assert.equal(next.state.loaded, true)
  })

  it('opens already loaded rows without reading again', () => {
    const closed = { open: false, loaded: true, loading: false }
    const next = togglePeriodTotals(closed)
    assert.equal(next.fetch, false)
    assert.equal(next.state.loading, false)
    assert.equal(next.state.open, true)
  })

  it('reloads on demand and ignores a second click while the read is running', () => {
    const closed = { open: false, loaded: true, loading: false }
    const reload = reloadPeriodTotals(closed)
    assert.equal(reload.fetch, true)
    assert.equal(reload.state.loading, true)
    assert.equal(reload.state.open, false)
    const again = reloadPeriodTotals(reload.state)
    assert.equal(again.fetch, false)
    assert.equal(again.state, reload.state)
  })

  it('keeps the panel closed while a collapsed reload is already running', () => {
    const loading = { open: false, loaded: false, loading: true }
    const next = togglePeriodTotals(loading)
    assert.equal(next.fetch, false)
    assert.equal(next.state.open, true)
    assert.equal(next.state.loading, true)
  })

  it('lets the next open retry after a failed read', () => {
    const failed = periodTotalsFailed({ open: true, loaded: false, loading: true })
    assert.deepEqual(failed, { open: true, loaded: false, loading: false })
    const closed = togglePeriodTotals(failed)
    const reopened = togglePeriodTotals(closed.state)
    assert.equal(reopened.fetch, true)
  })
})

describe('PERIOD_TOTALS_PANEL_HEIGHT', () => {
  it('starts at the short Delphi height', () => {
    assert.equal(PERIOD_TOTALS_PANEL_HEIGHT, 160)
    assert.equal(PERIOD_TOTALS_MIN_HEIGHT, 96)
  })
})

describe('clampPeriodTotalsHeight', () => {
  it('keeps the default when the column height is unknown', () => {
    assert.equal(clampPeriodTotalsHeight(null, 0), 160)
    assert.equal(clampPeriodTotalsHeight(50, 0), PERIOD_TOTALS_MIN_HEIGHT)
    assert.equal(clampPeriodTotalsHeight(400, 0), 400)
  })

  it('does not shrink below the minimum or cover the tree and status bar', () => {
    assert.equal(clampPeriodTotalsHeight(160, 800), 160)
    assert.equal(clampPeriodTotalsHeight(40, 800), PERIOD_TOTALS_MIN_HEIGHT)
    assert.equal(clampPeriodTotalsHeight(900, 800), 800 - 32 - 120)
  })

  it('keeps the minimum when the column is already short', () => {
    assert.equal(clampPeriodTotalsHeight(200, 200), PERIOD_TOTALS_MIN_HEIGHT)
  })
})

describe('period totals height storage', () => {
  it('remembers a dragged height', () => {
    const store = new Map()
    globalThis.localStorage = {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => {
        store.set(key, String(value))
      },
    }
    assert.equal(readStoredPeriodTotalsHeight(), null)
    writeStoredPeriodTotalsHeight(240)
    assert.equal(readStoredPeriodTotalsHeight(), 240)
    writeStoredPeriodTotalsHeight(0)
    assert.equal(readStoredPeriodTotalsHeight(), 240)
  })
})
