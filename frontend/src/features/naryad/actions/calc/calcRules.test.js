import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CALC_LABEL, CALC_REBUILT_MESSAGE, canCalcOper } from './calcRules.js'

const leaf = { operlifetype: 79, hasChildren: false, locked: 0 }

describe('calc oper', () => {
  it('uses the Delphi caption and the rebuild warning with its original spelling', () => {
    assert.equal(CALC_LABEL, 'Расчёт нормы')
    assert.equal(
      CALC_REBUILT_MESSAGE,
      'Операция была перестроена проверьте параметры и повторите рассчет!',
    )
  })

  it('enables calculation only for an open unlocked leaf of type 79 or 80', () => {
    assert.equal(canCalcOper(leaf, false, false), true)
    assert.equal(canCalcOper({ ...leaf, operlifetype: 80 }, false, false), true)
    assert.equal(canCalcOper({ ...leaf, operlifetype: '80' }, false, false), true)
    assert.equal(canCalcOper({ ...leaf, operlifetype: 78 }, false, false), false)
    assert.equal(canCalcOper({ ...leaf, operlifetype: 82 }, false, false), false)
    assert.equal(canCalcOper({ ...leaf, operlifetype: null }, false, false), false)
    assert.equal(canCalcOper({ ...leaf, hasChildren: true }, false, false), false)
    assert.equal(canCalcOper({ ...leaf, locked: 1 }, false, false), false)
    assert.equal(canCalcOper(leaf, true, false), false)
    assert.equal(canCalcOper(leaf, null, false), false)
    assert.equal(canCalcOper(leaf, false, true), false)
    assert.equal(canCalcOper(null, false, false), false)
  })
})
