import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  REPLACE_CONFIRM,
  REPLACE_SAVED_MESSAGE,
  canReplaceZadanie,
} from './replaceRules.js'

describe('canReplaceZadanie', () => {
  it('is available for an admin and for a regular user, even when the part is closed', () => {
    assert.equal(canReplaceZadanie({ pending: false }), true)
    assert.equal(
      REPLACE_CONFIRM,
      'Наряд-задание будет заменено на наряд-выполнение, Вы уверены, что хотите продолжить?',
    )
    assert.equal(REPLACE_SAVED_MESSAGE, 'Изменения успешно сохранены!')
  })

  it('waits while a request is running', () => {
    assert.equal(canReplaceZadanie({ pending: true }), false)
  })
})
