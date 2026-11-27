import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CLOSED_SEARCH_HINT,
  REFRESH_CONFIRM_MESSAGE,
  TEHMESTO_TOO_SHORT_MESSAGE,
  refreshDoneMessage,
  wellSearchFilters,
  searchSeed,
  shouldSearchOnOpen,
  stripKustPrefix,
  stripWellPrefix,
  tehmestoRefreshable,
  tehmestoSearched,
} from './wellSearchRules.js'
import { applyWellSelection, locationReferenceLabel } from './globalRules.js'

const rows = [
  { parcode: 149, prnum: 1, znval: 10, znnm: 'СКВ.15', val: null, valstr: 'СКВ.15' },
  { parcode: 470, prnum: 2, znval: 20, znnm: 'К.3', val: 1, valstr: 'К.3' },
  { parcode: 5, prnum: 3, znval: 30, znnm: 'Самотлор', val: null, valstr: 'Самотлор' },
  { parcode: 501, prnum: 4, znval: 70, znnm: 'Прочее', val: 2, valstr: 'а' },
]

describe('well search fields', () => {
  it('drops the first well and cluster prefix without changing the field name', () => {
    assert.equal(stripWellPrefix('СКВ.15'), '15')
    assert.equal(stripWellPrefix('скв.15 СКВ.2'), '15 СКВ.2')
    assert.equal(stripWellPrefix('15'), '15')
    assert.equal(stripWellPrefix(null), '')
    assert.equal(stripKustPrefix('К.3'), '3')
    assert.equal(stripKustPrefix('к.3 К.4'), '3 К.4')
    assert.equal(stripKustPrefix('куст'), 'куст')
  })

  it('seeds the dialog from the current names and searches when any name remains', () => {
    const seed = searchSeed(rows, {})
    assert.deepEqual(seed, { skv: '15', mest: 'Самотлор', kust: '3', wellId: 10 })
    assert.equal(shouldSearchOnOpen(seed), true)
    assert.equal(shouldSearchOnOpen({ skv: '', mest: '', kust: '' }), false)
  })

  it('seeds a name already chosen and not yet saved', () => {
    const draft = {
      '149:1': {
        original: { znval: '10', val: '', valstr: 'СКВ.15' },
        values: { znval: '99', val: '', valstr: 'СКВ.99', znnm: 'СКВ.99' },
      },
    }
    assert.equal(searchSeed(rows, draft).skv, '99')
    assert.equal(searchSeed(rows, draft).wellId, '99')
  })

  it('uses a tech place in search only after four characters and for refresh from nine', () => {
    assert.equal(tehmestoSearched('1234'), false)
    assert.equal(tehmestoSearched('12345'), true)
    assert.equal(tehmestoSearched(''), false)
    assert.equal(tehmestoRefreshable('12345678'), false)
    assert.equal(tehmestoRefreshable('123456789'), true)
    assert.match(TEHMESTO_TOO_SHORT_MESSAGE, /не менее 9 символов/)
    assert.match(REFRESH_CONFIRM_MESSAGE, /несколько минут/)
    assert.equal(refreshDoneMessage('ABC'), 'Данные по тех.месту: ABC*  обновлены')
    assert.match(CLOSED_SEARCH_HINT, /Поиск скважины недоступен/)
  })

  it('sends search fields as table filters and stays idle before the first search', () => {
    assert.deepEqual(wellSearchFilters(null, 10), [{ id: 'ready', value: '0' }])
    assert.deepEqual(
      wellSearchFilters({ skv: '15', mest: '', kust: '3', tehmesto: '12345' }, 10),
      [
        { id: 'skv', value: '15' },
        { id: 'kust', value: '3' },
        { id: 'tehmesto', value: '12345' },
        { id: 'current', value: '10' },
      ],
    )
    assert.deepEqual(
      wellSearchFilters({ skv: '15', mest: '', kust: '', tehmesto: '' }, null),
      [{ id: 'skv', value: '15' }],
    )
  })
})

describe('well selection draft', () => {
  it('writes well, cluster and field and leaves the other parameter and numbers', () => {
    const draft = applyWellSelection({}, rows, {
      wellId: 11,
      wellNm: 'СКВ.16',
      kustId: 21,
      kustNm: 'К.4',
      mestId: 30,
      mestNm: 'Самотлор',
    })
    assert.equal(draft['149:1'].values.znval, '11')
    assert.equal(draft['149:1'].values.valstr, 'СКВ.16')
    assert.equal(draft['149:1'].values.znnm, 'СКВ.16')
    assert.equal(draft['149:1'].values.val, '')
    assert.equal(draft['470:2'].values.znval, '21')
    assert.equal(draft['470:2'].values.val, '1')
    assert.equal(draft['5:3'], undefined)
    assert.equal(draft['501:4'], undefined)
    assert.equal(locationReferenceLabel(draft, rows[0]), 'СКВ.16')
    assert.equal(locationReferenceLabel(draft, rows[3]), 'Прочее')
  })

  it('drops the draft when the chosen ids are the saved ones', () => {
    const changed = applyWellSelection({}, rows, {
      wellId: 11,
      wellNm: 'СКВ.16',
      kustId: 20,
      kustNm: 'К.3',
      mestId: 30,
      mestNm: 'Самотлор',
    })
    const back = applyWellSelection(changed, rows, {
      wellId: 10,
      wellNm: 'СКВ.15',
      kustId: 20,
      kustNm: 'К.3',
      mestId: 30,
      mestNm: 'Самотлор',
    })
    assert.deepEqual(back, {})
  })
})
