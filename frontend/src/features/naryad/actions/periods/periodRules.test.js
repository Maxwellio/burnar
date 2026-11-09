import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  NO_PERIODS_MESSAGE,
  NOT_ALL_LOCKED_MESSAGE,
  PERIOD_DELETE_CONFIRM,
  PERIOD_NAME_MAX,
  canOpenPeriodBind,
  periodBindIds,
  periodBindRefusal,
  periodBindRows,
  periodFormError,
  periodListColumnDefs,
  periodOptionLabel,
} from './periodRules.js'

describe('period form', () => {
  it('requires a name, both timestamps, and an end that is not earlier than the start', () => {
    assert.equal(PERIOD_NAME_MAX, 128)
    assert.equal(periodFormError({ nm: '  ', beg: '2026-01-01T08:00:00', end: '2026-01-02T08:00:00' }), 'Укажите название периода')
    assert.equal(
      periodFormError({ nm: 'я'.repeat(129), beg: '2026-01-01T08:00:00', end: '2026-01-02T08:00:00' }),
      'Название периода не длиннее 128 символов',
    )
    assert.equal(periodFormError({ nm: 'Январь', beg: null, end: '2026-01-02T08:00:00' }), 'Укажите дату и время начала и окончания')
    assert.equal(
      periodFormError({ nm: 'Январь', beg: '2026-01-02T08:00:00', end: '2026-01-01T08:00:00' }),
      'Окончание не может быть раньше начала',
    )
    assert.equal(periodFormError({ nm: ' Январь ', beg: '2026-01-01T08:00:00', end: '2026-01-01T08:00:00' }), null)
  })

  it('asks before deleting a period and names a period with its timestamps', () => {
    assert.equal(
      PERIOD_DELETE_CONFIRM,
      'Удаление периода снимет привязку работ и удалит значения отчёта этого периода. Продолжить?',
    )
    assert.equal(NO_PERIODS_MESSAGE, 'Нет периодов выполнения работ.')
    assert.equal(
      periodOptionLabel({
        nm: 'Январь',
        begoperdate: '2026-01-01T08:30:00',
        outoperdate: '2026-01-31T18:00:00',
      }),
      'Январь (01.01.2026 08:30:00 - 31.01.2026 18:00:00)',
    )
  })
})

describe('period list columns', () => {
  it('shows the name and both dates without filters', () => {
    const columns = periodListColumnDefs()
    assert.deepEqual(columns.map((column) => column.header), [
      'Название',
      'Дата начала работ',
      'Дата окончания работ',
    ])
    assert.equal(columns.every((column) => column.enableColumnFilter === false), true)
    const begin = columns[1].cell({ getValue: () => '2026-01-01T08:30:00' })
    assert.equal(begin, '01.01.2026 08:30:00')
  })
})

describe('period bind selection', () => {
  const flags = new Map([
    ['1', 1],
    ['2', 0],
    ['3', 1],
    ['4', 1],
    ['5', 1],
  ])

  it('keeps every selected row, including a block and type 81', () => {
    const rows = periodBindRows([1, 2, 3, 4, 5, 9], flags)
    assert.deepEqual(periodBindIds(rows), [1, 2, 3, 4, 5])
  })

  it('enables the button for an operation or a block when the part is open', () => {
    assert.equal(canOpenPeriodBind(periodBindRows([1], flags), false, false), true)
    assert.equal(canOpenPeriodBind(periodBindRows([3, 4], flags), false, false), true)
    assert.equal(canOpenPeriodBind(periodBindRows([1], flags), true, false), false)
    assert.equal(canOpenPeriodBind(periodBindRows([1], flags), false, true), false)
    assert.equal(canOpenPeriodBind(periodBindRows([1], null), false, false), false)
  })

  it('refuses the bind unless every selected row is locked', () => {
    assert.equal(periodBindRefusal(periodBindRows([1, 5], flags)), null)
    assert.equal(periodBindRefusal(periodBindRows([3, 4], flags)), null)
    assert.equal(periodBindRefusal(periodBindRows([1, 2], flags)), NOT_ALL_LOCKED_MESSAGE)
    assert.equal(NOT_ALL_LOCKED_MESSAGE, 'Не все работы заблокированы!')
  })
})
