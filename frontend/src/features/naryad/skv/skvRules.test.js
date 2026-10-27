import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applySkvEdit,
  buildSkvSavePayload,
  canSaveSkv,
  changedSkvRows,
  formatSkvNumber,
  isSkvDirty,
  parseSkvNumber,
  sanitizeSkvNumberInput,
  sideBySidePosition,
  skvBegDateChanged,
  skvCellValue,
  skvChangedFields,
  skvNeedsResetConfirm,
} from './skvRules.js'

const row = { parcode: 501, prnum: 1, znval: 7001, val: 12.5, valstr: null }

describe('number input', () => {
  it('keeps digits, one comma and a leading minus like EdKeyPress', () => {
    assert.equal(sanitizeSkvNumberInput('-12.5a'), '-12,5')
    assert.equal(sanitizeSkvNumberInput('1,2,3'), '1,23')
    assert.equal(sanitizeSkvNumberInput('5-'), '5')
    assert.equal(sanitizeSkvNumberInput(''), '')
  })

  it('parses comma decimals and empty input', () => {
    assert.equal(parseSkvNumber('12,5'), 12.5)
    assert.equal(parseSkvNumber(' '), null)
    assert.equal(parseSkvNumber('-'), null)
    assert.ok(Number.isNaN(parseSkvNumber('1,2,3')))
  })

  it('shows numeric(8,4) without trailing zeros', () => {
    assert.equal(formatSkvNumber(12.5), '12,5')
    assert.equal(formatSkvNumber('3.0000'), '3')
    assert.equal(formatSkvNumber(null), '')
  })
})

describe('draft', () => {
  it('reads the edited value and falls back to the row', () => {
    const draft = applySkvEdit({}, row, 'valstr', 'abc')
    assert.equal(skvCellValue(draft, row, 'valstr'), 'abc')
    assert.equal(skvCellValue(draft, row, 'val'), '12,5')
    assert.equal(skvCellValue({}, row, 'znval'), '7001')
  })

  it('does not count a value returned to the original', () => {
    let draft = applySkvEdit({}, row, 'val', '13')
    assert.equal(changedSkvRows(draft).length, 1)
    draft = applySkvEdit(draft, row, 'val', '12,50')
    assert.equal(changedSkvRows(draft).length, 0)
  })

  it('marks only the fields that differ from the original', () => {
    assert.deepEqual(skvChangedFields({}, row), { znval: false, val: false, valstr: false })
    const draft = applySkvEdit({}, row, 'val', '13')
    assert.deepEqual(skvChangedFields(draft, row), { znval: false, val: true, valstr: false })
    assert.deepEqual(
      skvChangedFields(applySkvEdit(draft, row, 'val', '12,50'), row),
      { znval: false, val: false, valstr: false },
    )
  })

  it('asks about zeroed norms only for znval and val', () => {
    assert.equal(skvNeedsResetConfirm(applySkvEdit({}, row, 'valstr', 'x')), false)
    assert.equal(skvNeedsResetConfirm(applySkvEdit({}, row, 'val', '1')), true)
    assert.equal(skvNeedsResetConfirm(applySkvEdit({}, row, 'znval', '7002')), true)
    assert.equal(skvNeedsResetConfirm(applySkvEdit({}, row, 'znval', '7001')), false)
  })

  it('sends only changed rows with typed values', () => {
    let draft = applySkvEdit({}, row, 'znval', '')
    draft = applySkvEdit(draft, row, 'valstr', '')
    draft = applySkvEdit(draft, { parcode: 502, prnum: 2, znval: null, val: null, valstr: 'a' }, 'valstr', 'a')
    assert.deepEqual(buildSkvSavePayload('2026-10-19T08:30:00', draft), {
      begDate: '2026-10-19T08:30:00',
      params: [{ parcode: 501, prnum: 1, znval: null, val: 12.5, valstr: null }],
    })
  })
})

describe('saving', () => {
  it('compares the start date to the second', () => {
    assert.equal(skvBegDateChanged('2026-10-19T08:30:00', '2026-10-19T08:30:00'), false)
    assert.equal(skvBegDateChanged('2026-10-19T08:30:00', '2026-10-19T08:30:59'), true)
    assert.equal(skvBegDateChanged('2026-10-19T08:30:00', '2026-10-19T08:31:00'), true)
    assert.equal(skvBegDateChanged(null, '2026-10-19T08:31:00'), true)
  })

  it('needs a date, a change, no bad numbers and an editable part', () => {
    const draft = applySkvEdit({}, row, 'val', '1')
    const base = { loaded: true, readOnly: false, saving: false, begDate: '2026-10-19T08:30:00', draft }
    const dirty = isSkvDirty({ savedBegDate: base.begDate, begDate: base.begDate, draft })
    assert.equal(canSaveSkv({ ...base, dirty }), true)
    assert.equal(canSaveSkv({ ...base, dirty, begDate: null }), false)
    assert.equal(canSaveSkv({ ...base, dirty, readOnly: true }), false)
    assert.equal(canSaveSkv({ ...base, dirty, saving: true }), false)
    assert.equal(canSaveSkv({ ...base, dirty: false }), false)
    const bad = applySkvEdit({}, row, 'val', '1,2,3')
    assert.equal(canSaveSkv({ ...base, dirty: true, draft: bad }), false)
  })
})

describe('sideBySidePosition', () => {
  const size = { width: 600, height: 500, viewportWidth: 1920, viewportHeight: 1000 }

  it('opens to the right of the opener when it fits', () => {
    const openerRect = { left: 660, right: 1260, top: 250 }
    assert.deepEqual(sideBySidePosition({ ...size, openerRect }), { x: 616, y: 0 })
  })

  it('falls back to the left side', () => {
    const openerRect = { left: 1300, right: 1900, top: 100 }
    assert.deepEqual(sideBySidePosition({ ...size, openerRect }), { x: 24, y: -150 })
  })

  it('stays centered without an opener', () => {
    assert.deepEqual(sideBySidePosition({ ...size, openerRect: null }), { x: 0, y: 0 })
  })
})
