import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CLOSE_SAVED_MESSAGE,
  canToggleClosed,
  closeActionLabel,
  closeConfirmMessage,
  reloadsAfterClose,
  reportsSavedAfterClose,
} from './closeRules.js'

describe('closeActionLabel', () => {
  it('offers to close an open part and to open a closed one', () => {
    assert.equal(closeActionLabel('zadanie', false), 'Закрыть задание от изменения')
    assert.equal(closeActionLabel('vipolnenie', false), 'Закрыть выполнение от изменения')
    assert.equal(closeActionLabel('zadanie', true), 'Открыть наряд')
    assert.equal(closeActionLabel('vipolnenie', true), 'Открыть наряд')
  })
})

describe('canToggleClosed', () => {
  it('waits for the header flag and for a running request', () => {
    assert.equal(canToggleClosed(false, false), true)
    assert.equal(canToggleClosed(true, false), true)
    assert.equal(canToggleClosed(null, false), false)
    assert.equal(canToggleClosed(undefined, false), false)
    assert.equal(canToggleClosed(false, true), false)
  })
})

describe('closing a part', () => {
  it('names the part in the confirmation', () => {
    assert.equal(closeConfirmMessage('zadanie'), 'Наряд-задание будет закрыто!')
    assert.equal(closeConfirmMessage('vipolnenie'), 'Наряд-выполнение будет закрыто!')
  })

  it('reloads only a closed zadanie and reports success only for a closed vipolnenie', () => {
    assert.equal(reloadsAfterClose('zadanie', true), true)
    assert.equal(reloadsAfterClose('zadanie', false), false)
    assert.equal(reloadsAfterClose('vipolnenie', true), false)
    assert.equal(reportsSavedAfterClose('vipolnenie', true), true)
    assert.equal(reportsSavedAfterClose('vipolnenie', false), false)
    assert.equal(reportsSavedAfterClose('zadanie', true), false)
    assert.equal(CLOSE_SAVED_MESSAGE, 'Изменения успешно сохранены!')
  })
})
