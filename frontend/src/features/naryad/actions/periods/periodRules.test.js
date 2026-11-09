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
  periodOptionLabel,
} from './periodRules.js'

const structure = new Map([
  [1, { id: 1, operlifetype: 80, locked: 1 }],
  [2, { id: 2, operlifetype: 79, locked: 0 }],
  [3, { id: 3, operlifetype: null, locked: 1 }],
  [4, { id: 4, operlifetype: 81, locked: 1 }],
  [5, { id: 5, operlifetype: 82, locked: 1 }],
])

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

describe('period bind selection', () => {
  it('keeps only rows Delphi can select: not a block and not type 81', () => {
    const rows = periodBindRows([1, 2, 3, 4, 5, 9], structure, new Map())
    assert.deepEqual(periodBindIds(rows), [1, 2, 5])
  })

  it('enables the button when such a row is selected and the part is open', () => {
    const rows = periodBindRows([1], structure, new Map())
    assert.equal(canOpenPeriodBind(rows, false, false), true)
    assert.equal(canOpenPeriodBind(rows, true, false), false)
    assert.equal(canOpenPeriodBind(rows, false, true), false)
    assert.equal(canOpenPeriodBind(periodBindRows([3, 4], structure, new Map()), false, false), false)
    assert.equal(canOpenPeriodBind(periodBindRows([1], null, new Map()), false, false), false)
  })

  it('refuses the bind unless every bindable row is locked', () => {
    const locked = periodBindRows([1, 5], structure, new Map([['1', 1], ['5', 1]]))
    assert.equal(periodBindRefusal(locked), null)
    const mixed = periodBindRows([1, 2], structure, new Map([['1', 1], ['2', 0]]))
    assert.equal(periodBindRefusal(mixed), NOT_ALL_LOCKED_MESSAGE)
    assert.equal(NOT_ALL_LOCKED_MESSAGE, 'Не все работы заблокированы!')
  })
})
