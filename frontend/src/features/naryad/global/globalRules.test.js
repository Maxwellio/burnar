import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyGlobalEdit,
  buildGlobalSavePayload,
  canSaveGlobal,
  globalCellValue,
  globalChangedFields,
  globalRowEditable,
  isGlobalDirty,
  selectWellType,
  toggleReportParam,
} from './globalRules.js'

const row = { parcode: 501, prnum: 1, znval: 70, val: 1.5, valstr: 'а' }

describe('global row editing', () => {
  it('keeps well, cluster and field read-only', () => {
    assert.deepEqual(globalRowEditable(false, 149), { reference: false, value: false })
    assert.deepEqual(globalRowEditable(false, 5), { reference: false, value: false })
    assert.deepEqual(globalRowEditable(false, 470), { reference: false, value: false })
    assert.deepEqual(globalRowEditable(false, 501), { reference: true, value: true })
  })

  it('locks every table cell when the naryad is closed', () => {
    assert.deepEqual(globalRowEditable(true, 501), { reference: false, value: false })
  })
})

describe('global draft', () => {
  it('bolds only the cell that differs and treats zero as empty', () => {
    const empty = { ...row, val: null }
    const draft = applyGlobalEdit({}, empty, 'val', '0')
    assert.equal(globalChangedFields(draft, empty).val, false)
    const changed = applyGlobalEdit({}, row, 'val', '2')
    assert.equal(globalChangedFields(changed, row).val, true)
    assert.equal(globalChangedFields(changed, row).valstr, false)
  })

  it('is dirty when the owner, a cell or a checkbox changes', () => {
    const base = {
      savedOwnerNar: 4,
      ownerNar: 4,
      savedShifr: 'A',
      shifr: 'A',
      savedNm: 'Имя',
      nm: 'Имя',
      draft: {},
      savedWellTypeIds: [1],
      wellTypeIds: [1],
      savedReportParamIds: [8],
      reportParamIds: [8],
    }
    assert.equal(isGlobalDirty(base), false)
    assert.equal(isGlobalDirty({ ...base, ownerNar: 5 }), true)
    assert.equal(isGlobalDirty({ ...base, draft: applyGlobalEdit({}, row, 'valstr', 'б') }), true)
    assert.equal(isGlobalDirty({ ...base, reportParamIds: selectReport(base, 9) }), true)
  })

  it('selects a single well type and toggles report params', () => {
    assert.deepEqual(selectWellType([1, 2], 2), [2])
    assert.deepEqual(selectWellType([2], 2), [2])
    assert.deepEqual(toggleReportParam([8], 9).sort(), [8, 9])
    assert.deepEqual(toggleReportParam([8, 9], 8), [9])
  })

  it('sends changed header, rows and checklists', () => {
    const state = {
      savedOwnerNar: 4,
      ownerNar: 6,
      savedShifr: 'A',
      shifr: 'B',
      savedNm: 'Имя',
      nm: 'Имя',
      draft: applyGlobalEdit({}, row, 'znval', '80'),
      savedWellTypeIds: [1],
      wellTypeIds: [3],
      savedReportParamIds: [8],
      reportParamIds: [8, 9],
    }
    assert.deepEqual(buildGlobalSavePayload(state), {
      ownerNar: 6,
      shifr: 'B',
      nm: 'Имя',
      params: [{ parcode: 501, prnum: 1, znval: 80, val: 1.5, valstr: 'а' }],
      checksChanged: true,
      wellTypeIds: [3],
      reportParamIds: [8, 9],
    })
  })

  it('refuses save while a number is invalid or the form is clean', () => {
    const base = {
      loaded: true,
      saving: false,
      savedOwnerNar: 4,
      ownerNar: 4,
      savedShifr: '',
      shifr: '',
      savedNm: 'Имя',
      nm: 'Имя',
      draft: {},
      savedWellTypeIds: [],
      wellTypeIds: [],
      savedReportParamIds: [],
      reportParamIds: [],
    }
    assert.equal(canSaveGlobal(base), false)
    const dirty = { ...base, shifr: 'X' }
    assert.equal(canSaveGlobal(dirty), true)
    assert.equal(canSaveGlobal({ ...dirty, shifr: 'я'.repeat(21) }), false)
    assert.equal(canSaveGlobal({
      ...dirty,
      draft: applyGlobalEdit({}, row, 'val', '1,2,3'),
    }), false)
  })
})

function selectReport(state, id) {
  return toggleReportParam(state.reportParamIds, id)
}

describe('cell display', () => {
  it('uses an empty string for a null text value', () => {
    assert.equal(globalCellValue({}, { ...row, valstr: null }, 'valstr'), '')
    assert.equal(globalCellValue({}, { ...row, val: null }, 'val'), '')
  })
})
