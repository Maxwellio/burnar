import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { paramColumnDefs, paramRowNumber } from './paramColumns.js'

describe('paramRowNumber', () => {
  it('numbers rows from 1 in display order', () => {
    assert.equal(paramRowNumber(0), 1)
    assert.equal(paramRowNumber(4), 5)
  })
})

describe('paramColumnDefs', () => {
  it('puts a fixed number column before the parameter and its value', () => {
    const columns = paramColumnDefs('zadp')
    assert.deepEqual(
      columns.map((column) => column.header),
      ['№', 'Параметр', 'Значение'],
    )
    assert.deepEqual(
      columns.map((column) => column.id),
      ['zadp_num', 'zadp_nm', 'zadp_val'],
    )
    assert.equal(columns[1].accessorKey, 'nm')
    assert.equal(columns[2].accessorKey, 'val')
    assert.ok(columns.every((column) => column.enableSorting === false))
  })

  it('builds a separate list for vipolnenie', () => {
    const zadanie = paramColumnDefs('zadp')
    const vipolnenie = paramColumnDefs('vipp')
    zadanie[0].header = 'изменено'
    assert.equal(vipolnenie[0].header, '№')
    assert.equal(vipolnenie[0].id, 'vipp_num')
  })
})
