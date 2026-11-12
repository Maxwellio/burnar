import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  FACT_DATE_DIALOG_TITLE,
  FACT_DATE_LABEL,
  FACT_DATE_REQUIRED,
  FACT_DATE_SAVED_MESSAGE,
  canSetFactDate,
  factDateFormError,
  factDateInitial,
} from './factDateRules.js'

describe('fact date button', () => {
  const flags = new Map([
    ['7', 0],
    ['8', 1],
    ['9', null],
  ])

  it('is enabled for exactly one unlocked row of an open execution', () => {
    assert.equal(FACT_DATE_LABEL, 'Установка фактической даты выполнения работы')
    assert.equal(FACT_DATE_DIALOG_TITLE, 'Дата начала работ в новом наряде:')
    assert.equal(FACT_DATE_SAVED_MESSAGE, 'Изменения успешно сохранены!')
    assert.equal(canSetFactDate(['7'], flags, false, false), true)
    assert.equal(canSetFactDate(['9'], flags, false, false), true)
    assert.equal(canSetFactDate(['8'], flags, false, false), false)
    assert.equal(canSetFactDate(['7', '9'], flags, false, false), false)
    assert.equal(canSetFactDate(['7'], flags, true, false), false)
    assert.equal(canSetFactDate(['7'], flags, false, true), false)
    assert.equal(canSetFactDate(['7'], null, false, false), false)
    assert.equal(canSetFactDate(['missing'], flags, false, false), false)
    assert.equal(canSetFactDate([], flags, false, false), false)
  })

  it('opens on the stored timestamp and uses the current moment when the row has none', () => {
    const now = '2026-11-12T10:00:00'
    assert.equal(factDateInitial('2024-02-01T08:15:00', now), '2024-02-01T08:15:00')
    assert.equal(factDateInitial(null, now), now)
    assert.equal(factDateInitial('01.02.2024 08:15:00', now), now)
    assert.equal(factDateFormError(''), FACT_DATE_REQUIRED)
    assert.equal(factDateFormError('2024-02-01T08:15:00'), null)
  })
})
