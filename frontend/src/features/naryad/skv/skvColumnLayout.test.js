import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyColumnWidths,
  columnSizesTotal,
  fitColumnSizes,
  readColumnSizes,
  resizeColumn,
  sameColumnSizes,
} from './skvColumnLayout.js'

const columns = [
  { id: 'skv-nm', size: 220 },
  { id: 'skv-znval', size: 220 },
  { id: 'skv-val', size: 110 },
  { id: 'skv-valstr', size: 180 },
]
const order = columns.map((column) => column.id)

describe('skv column layout', () => {
  it('reads saved BaseTable sizes and falls back to column size', () => {
    const sizes = readColumnSizes(columns, { 'skv-nm': 400, 'skv-val': 0 })
    assert.equal(sizes['skv-nm'], 400)
    assert.equal(sizes['skv-znval'], 220)
    assert.equal(sizes['skv-val'], 110)
    assert.equal(sizes['skv-valstr'], 180)
  })

  it('fits every column inside the window and keeps proportions', () => {
    const sizes = fitColumnSizes(readColumnSizes(columns, null), order, 1000)
    assert.equal(columnSizesTotal(sizes, order), 1000)
    assert.ok(sizes['skv-nm'] > sizes['skv-val'])
    assert.ok(sizes['skv-znval'] > sizes['skv-valstr'])
    assert.equal(sameColumnSizes(sizes, fitColumnSizes(sizes, order, 1000)), true)
  })

  it('shrinks widths saved above the window, including the old 4000px cap', () => {
    const sizes = fitColumnSizes({
      'skv-nm': 4000,
      'skv-znval': 400,
      'skv-val': 200,
      'skv-valstr': 300,
    }, order, 800)
    assert.equal(columnSizesTotal(sizes, order), 800)
    assert.ok(sizes['skv-nm'] < 800)
    assert.ok(Object.values(sizes).every((size) => size >= 40))
  })

  it('gives a dragged column the requested width and redistributes the rest', () => {
    const fitted = fitColumnSizes(readColumnSizes(columns, null), order, 1000)
    const requested = fitted['skv-nm'] + 120
    const next = resizeColumn(fitted, order, 'skv-nm', requested, 1000)
    assert.equal(next['skv-nm'], requested)
    assert.equal(columnSizesTotal(next, order), 1000)
    assert.ok(next['skv-znval'] < fitted['skv-znval'])
    assert.ok(next['skv-val'] < fitted['skv-val'])
    assert.ok(next['skv-valstr'] < fitted['skv-valstr'])
  })

  it('keeps columns to the left while the dragged border takes width from the right', () => {
    const fitted = fitColumnSizes(readColumnSizes(columns, null), order, 1000)
    const requested = fitted['skv-znval'] + 50
    const next = resizeColumn(fitted, order, 'skv-znval', requested, 1000)
    assert.equal(next['skv-nm'], fitted['skv-nm'])
    assert.equal(next['skv-znval'], requested)
    assert.ok(next['skv-val'] < fitted['skv-val'])
    assert.equal(columnSizesTotal(next, order), 1000)
  })

  it('returns freed width to the other columns', () => {
    const fitted = fitColumnSizes(readColumnSizes(columns, null), order, 1000)
    const next = resizeColumn(fitted, order, 'skv-valstr', fitted['skv-valstr'] - 80, 1000)
    assert.equal(next['skv-valstr'], fitted['skv-valstr'] - 80)
    assert.equal(columnSizesTotal(next, order), 1000)
    assert.ok(next['skv-nm'] > fitted['skv-nm'])
  })

  it('stops at the minimum of the other columns instead of leaving the window', () => {
    const fitted = fitColumnSizes(readColumnSizes(columns, null), order, 1000)
    const next = resizeColumn(fitted, order, 'skv-nm', 5000, 1000)
    assert.equal(columnSizesTotal(next, order), 1000)
    assert.equal(next['skv-znval'], 40)
    assert.equal(next['skv-val'], 40)
    assert.equal(next['skv-valstr'], 40)
    assert.equal(next['skv-nm'], 880)
  })

  it('writes percentage widths that sum to the container and ignores a short row', () => {
    const cell = () => ({
      tagName: 'TD',
      style: { width: '', maxWidth: '', minWidth: '' },
    })
    const headers = order.map(() => {
      const style = { width: 'var(--col-x-size)', maxWidth: '', minWidth: '' }
      return { tagName: 'TH', style }
    })
    const body = order.map(() => cell())
    const footer = [{
      tagName: 'TD',
      style: { width: '', maxWidth: '', minWidth: '' },
      getAttribute: () => null,
    }]
    const rows = [
      { children: headers },
      { children: body },
      { children: footer },
    ]
    const table = {
      style: { width: '1730px', maxWidth: '', minWidth: '' },
      querySelectorAll: () => rows,
    }
    const root = { querySelector: () => table }
    const sizes = fitColumnSizes(readColumnSizes(columns, null), order, 1000)
    assert.equal(applyColumnWidths(root, order, sizes), true)
    assert.equal(table.style.width, '100%')
    assert.equal(table.style.minWidth, '0px')
    assert.equal(table.style.maxWidth, '100%')
    const headerWidths = headers.map((header) => header.style.width)
    assert.equal(headerWidths.every((width) => width.endsWith('%')), true)
    const sum = headerWidths.reduce((acc, width) => acc + Number.parseFloat(width), 0)
    assert.ok(Math.abs(sum - 100) < 0.001)
    assert.equal(footer[0].style.width, '')
    assert.equal(applyColumnWidths(root, order, sizes), false)
  })
})
