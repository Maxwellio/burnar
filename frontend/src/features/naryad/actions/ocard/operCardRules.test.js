import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  OPER_CARD_LABEL,
  OPER_CARD_MISSING,
  OPER_CARD_TITLE,
  canShowOperCard,
  operCardPlan,
} from './operCardRules.js'

describe('oper card', () => {
  it('uses the Delphi hint and the explore-window caption', () => {
    assert.equal(OPER_CARD_LABEL, 'Показать оперкарту')
    assert.equal(OPER_CARD_TITLE, 'Операционные карты')
    assert.equal(OPER_CARD_MISSING, 'Оперкарта не найдена')
  })

  it('stays available on a closed part when one row is selected', () => {
    assert.equal(canShowOperCard(['7'], false), true)
    assert.equal(canShowOperCard(['7'], true), true)
    assert.equal(canShowOperCard(['7'], false, true), false)
    assert.equal(canShowOperCard([], false), false)
    assert.equal(canShowOperCard(['7', '8'], false), false)
  })

  it('opens one file, lists several, and reports an empty lookup', () => {
    assert.deepEqual(operCardPlan([]), { kind: 'missing' })
    assert.deepEqual(operCardPlan([{ fileName: '  ' }]), { kind: 'missing' })
    assert.deepEqual(operCardPlan([{ fileName: 'карта 1.htm' }]), {
      kind: 'open',
      url: '/api/ocards/files/%D0%BA%D0%B0%D1%80%D1%82%D0%B0%201.htm',
    })
    assert.deepEqual(operCardPlan([{ fileName: 'a.htm' }, { fileName: 'b.htm' }]), {
      kind: 'list',
      files: [
        { name: 'a.htm', url: '/api/ocards/files/a.htm' },
        { name: 'b.htm', url: '/api/ocards/files/b.htm' },
      ],
    })
  })
})
