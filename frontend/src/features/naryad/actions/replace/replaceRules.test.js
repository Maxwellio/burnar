import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  REPLACE_CONFIRM,
  REPLACE_SAVED_MESSAGE,
  canReplaceZadanie,
} from './replaceRules.js'

describe('canReplaceZadanie', () => {
  it('is available for the allowed org even when the part is closed', () => {
    assert.equal(canReplaceZadanie({ allowed: true, pending: false }), true)
    assert.equal(
      REPLACE_CONFIRM,
      'Наряд-задание будет заменено на наряд-выполнение, Вы уверены, что хотите продолжить?',
    )
    assert.equal(REPLACE_SAVED_MESSAGE, 'Изменения успешно сохранены!')
  })

  it('hides the action from other orgs and while a request is running', () => {
    assert.equal(canReplaceZadanie({ allowed: false, pending: false }), false)
    assert.equal(canReplaceZadanie({ allowed: null, pending: false }), false)
    assert.equal(canReplaceZadanie({ allowed: true, pending: true }), false)
  })
})
