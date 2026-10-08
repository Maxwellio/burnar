import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  closeActionLabel,
  lockActionState,
  lockFlagMap,
  selectedLockRows,
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
