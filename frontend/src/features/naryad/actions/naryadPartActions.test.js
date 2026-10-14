import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DELETE_BLOCK_CONFIRM,
  DELETE_LOCKED_MESSAGE,
  DELETE_MARKED_CONFIRM,
  canDeleteBlock,
  canDeleteMarkedWorks,
  closeActionLabel,
  lockActionState,
  lockFlagMap,
  selectedLockRows,
  selectionHasLockedWork,
} from './naryadPartActions.js'

describe('closeActionLabel', () => {
  it('offers to close an open part and to open a closed one', () => {
    assert.equal(closeActionLabel('zadanie', false), 'Закрыть задание от изменения')
    assert.equal(closeActionLabel('vipolnenie', false), 'Закрыть выполнение от изменения')
    assert.equal(closeActionLabel('zadanie', true), 'Открыть наряд')
    assert.equal(closeActionLabel('vipolnenie', true), 'Открыть наряд')
  })
})

describe('selectedLockRows', () => {
  it('keeps the loaded flag for a selected id and skips ids that were not loaded', () => {
    const flags = lockFlagMap([{ id: 10, locked: 1 }, { id: 11, locked: null }])
    assert.deepEqual(selectedLockRows([10, '11', 12], flags), [
      { id: 10, locked: 1 },
      { id: '11', locked: null },
    ])
  })

  it('returns nothing until the flag list has loaded', () => {
    assert.deepEqual(selectedLockRows([10], null), [])
    assert.deepEqual(selectedLockRows([10], lockFlagMap(null)), [])
  })
})

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

describe('lockActionState', () => {
  const row = (id, locked) => ({ id, locked })

  it('disables both buttons without a selection, while closed, or while a request is running', () => {
    assert.deepEqual(lockActionState([], false, false), { canLock: false, canUnlock: false })
    assert.deepEqual(lockActionState([row(1, 0)], true, false), { canLock: false, canUnlock: false })
    assert.deepEqual(lockActionState([row(1, 0)], false, true), { canLock: false, canUnlock: false })
  })

  it('enables only unlock when every selected row is locked', () => {
    assert.deepEqual(
      lockActionState([row(1, 1), row(2, '1')], false, false),
      { canLock: false, canUnlock: true },
    )
  })

  it('enables only lock when every selected row is unlocked', () => {
    assert.deepEqual(
      lockActionState([row(1, 0), row(2, null)], false, false),
      { canLock: true, canUnlock: false },
    )
  })

  it('enables both buttons when the selection mixes locked and unlocked rows', () => {
    assert.deepEqual(
      lockActionState([row(1, 1), row(2, 0)], false, false),
      { canLock: true, canUnlock: true },
    )
  })
})
