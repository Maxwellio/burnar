import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DELETE_BLOCK_CONFIRM,
  DELETE_LOCKED_MESSAGE,
  DELETE_MARKED_CONFIRM,
  canDeleteBlock,
  canDeleteMarkedWorks,
  selectionHasLockedWork,
} from './deleteRules.js'

describe('delete actions', () => {
  it('asks Delphi to confirm marked works and a block move, and names locked works', () => {
    assert.equal(
      DELETE_MARKED_CONFIRM,
      'Отмеченные работы будут удалены, Вы уверены, что хотите продолжить?',
    )
    assert.equal(
      DELETE_BLOCK_CONFIRM,
      'Удаление блока приведет к переносу внутренних работ на его уровень!\nВы уверены, что хотите продолжить?',
    )
    assert.equal(DELETE_LOCKED_MESSAGE, 'Не допускается удаление заблокированных работ!')
  })

  it('enables marked delete for one row or several, and disables it when closed or busy', () => {
    assert.equal(canDeleteMarkedWorks([10], false, false), true)
    assert.equal(canDeleteMarkedWorks([10, 11], false, false), true)
    assert.equal(canDeleteMarkedWorks([], false, false), false)
    assert.equal(canDeleteMarkedWorks([10], true, false), false)
    assert.equal(canDeleteMarkedWorks([10], false, true), false)
  })

  it('sees a locked work in the loaded vip selection', () => {
    assert.equal(selectionHasLockedWork([{ id: 1, locked: 0 }, { id: 2, locked: 1 }]), true)
    assert.equal(selectionHasLockedWork([{ id: 1, locked: 0 }]), false)
  })

  it('enables block delete only for one unlocked non-system block', () => {
    const block = { operlifetype: null, locked: 0, rs: '0' }
    assert.equal(canDeleteBlock(block, false, false), true)
    assert.equal(canDeleteBlock({ ...block, operlifetype: '' }, false, false), true)
    assert.equal(canDeleteBlock({ ...block, operlifetype: 79 }, false, false), false)
    assert.equal(canDeleteBlock({ ...block, locked: 1 }, false, false), false)
    assert.equal(canDeleteBlock({ ...block, rs: '1' }, false, false), false)
    assert.equal(canDeleteBlock(block, true, false), false)
    assert.equal(canDeleteBlock(null, false, false), false)
  })
})
