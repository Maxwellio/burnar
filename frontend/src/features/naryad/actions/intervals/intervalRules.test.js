import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  INTERVALS_DIALOG_TITLE,
  INTERVALS_LABEL,
  INTERVAL_TABS,
  formatIntervalBound,
  intervalColumnDefs,
  intervalRowColor,
} from './intervalRules.js'

describe('mechanical drilling interval check', () => {
  it('opens a read-only form with the two Delphi tabs', () => {
    assert.equal(INTERVALS_LABEL, 'Проверить работы по мех.бурению на непрерывность интервалов')
    assert.equal(INTERVALS_DIALOG_TITLE, 'Проверка интервалов')
    assert.deepEqual(INTERVAL_TABS.map((tab) => tab.title), ['Мех.Бурение', 'Наращивание'])
    assert.deepEqual(INTERVAL_TABS.map((tab) => tab.path), [
      'intervals/mehbur',
      'intervals/narashchivanie',
    ])
  })

  it('shows the Delphi columns and paints a gap with the function color', () => {
    const columns = intervalColumnDefs('meh')
    assert.deepEqual(columns.map((column) => column.header), [
      'Код',
      '№ п/п',
      'Название',
      'Интервал от',
      'Интервал до',
    ])
    assert.equal(columns.every((column) => column.enableColumnFilter === false), true)
    assert.equal(formatIntervalBound(12), '12.00')
    assert.equal(formatIntervalBound(null), '')
    assert.equal(intervalRowColor({ colorsel: 0 }), undefined)
    assert.equal(intervalRowColor({ colorsel: 8454143 }), '#ffff80')
    assert.equal(intervalRowColor({ colorsel: '8454143' }), '#ffff80')
  })
})
