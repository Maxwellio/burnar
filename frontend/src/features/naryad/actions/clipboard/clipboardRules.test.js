import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  NESTED_BLOCK_WARNING,
  canAddEmptyBlock,
  canCopyOrCut,
  canPaste,
  canRenameBlock,
  indexStructure,
  isCutMarked,
  isEmptyBlock,
  nestedSelectionWarning,
  pastePlaceChoices,
  pastePlaceMessage,
  visualOrder,
} from './clipboardRules.js'

const rows = [
  { id: 10, parentId: null, prnum: 1, operlifetype: null, locked: 0, rs: '1', hasChildren: true, nm: 'Раздел' },
  { id: 11, parentId: 10, prnum: 1, operlifetype: null, locked: 0, rs: '0', hasChildren: true, nm: 'Блок' },
  { id: 12, parentId: 11, prnum: 1, operlifetype: 80, locked: 0, rs: '0', hasChildren: false, nm: 'Работа' },
  { id: 13, parentId: 10, prnum: 2, operlifetype: 80, locked: 1, rs: '0', hasChildren: false, nm: 'Сосед' },
  { id: 14, parentId: 10, prnum: 3, operlifetype: null, locked: 0, rs: '0', hasChildren: false, nm: 'Пустой' },
]

describe('naryad clipboard rules', () => {
  const structure = indexStructure(rows)

  it('warns when a block and a work inside it are selected together', () => {
    assert.equal(nestedSelectionWarning([10, 13], structure), NESTED_BLOCK_WARNING)
    assert.equal(nestedSelectionWarning([11, 12], structure), NESTED_BLOCK_WARNING)
    assert.equal(nestedSelectionWarning([12, 13], structure), null)
    assert.equal(nestedSelectionWarning([12], structure), null)
  })

  it('keeps copy and cut off until the structure of a multi-selection is known', () => {
    assert.equal(canCopyOrCut([12, 13], false, false, null, false), false)
    assert.equal(canCopyOrCut([12], false, false, null, false), true)
    assert.equal(canCopyOrCut([11, 12], false, false, structure, true), false)
    assert.equal(canCopyOrCut([12, 13], true, false, structure, false), false)
  })

  it('orders the snapshot as the tree shows it', () => {
    assert.deepEqual(visualOrder([13, 12, 11], structure), [11, 12, 13])
  })

  it('marks only the cut snapshot', () => {
    assert.equal(isCutMarked({ mode: 'cut', nodeIds: [12, 13] }, 13), true)
    assert.equal(isCutMarked({ mode: 'copy', nodeIds: [13] }, 13), false)
  })

  it('pastes only into one unlocked row while a snapshot exists', () => {
    const clip = { mode: 'copy', nodeIds: [12] }
    assert.equal(canPaste(clip, structure.get(14), false, false), true)
    assert.equal(canPaste(clip, structure.get(13), false, false), false)
    assert.equal(canPaste(null, structure.get(14), false, false), false)
    assert.equal(canPaste(clip, null, false, false), false)
  })

  it('adds an empty block only before a row that already has a parent', () => {
    assert.equal(canAddEmptyBlock(structure.get(12), false, false, false), true)
    assert.equal(canAddEmptyBlock(structure.get(10), false, false, false), false)
    assert.equal(canAddEmptyBlock(structure.get(13), false, false, true), false)
    assert.equal(canAddEmptyBlock(structure.get(13), false, false, false), true)
    assert.equal(isEmptyBlock(structure.get(14)), true)
    assert.equal(isEmptyBlock(structure.get(11)), false)
  })

  it('asks before or after the selected row, and inside for every block', () => {
    assert.deepEqual(pastePlaceChoices(structure.get(12)).map((choice) => choice.result), ['before', 'after'])
    assert.deepEqual(
      pastePlaceChoices(structure.get(11)).map((choice) => choice.result),
      ['inside', 'before', 'after'],
    )
    assert.deepEqual(
      pastePlaceChoices(structure.get(14)).map((choice) => choice.result),
      ['inside', 'before', 'after'],
    )
    assert.equal(pastePlaceMessage(structure.get(12)), 'Куда поместить данные относительно выбранной записи?')
    assert.match(pastePlaceMessage(structure.get(11)), /блока/)
  })

  it('renames the same blocks that can be deleted without their children', () => {
    assert.equal(canRenameBlock(structure.get(14), false, false), true)
    assert.equal(canRenameBlock(structure.get(11), false, false), true)
    assert.equal(canRenameBlock(structure.get(10), false, false), false)
    assert.equal(canRenameBlock(structure.get(12), false, false), false)
    assert.equal(canRenameBlock(structure.get(13), false, false), false)
  })
})
