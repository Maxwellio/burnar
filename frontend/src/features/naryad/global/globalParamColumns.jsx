import { createValueParamColumns } from '../skv/skvParamColumns.jsx'
import { useGlobalEditor } from './GlobalEditorContext.jsx'
import {
  VALSTR_MAX,
  globalCellValue,
  globalChangedFields,
  globalRowEditable,
  locationReferenceLabel,
} from './globalRules.js'

/** Колонки средней таблицы GlobalVarUnit. Скважина, куст и месторождение только для чтения. */
export const globalParamColumns = createValueParamColumns({
  idPrefix: 'global',
  valueHeader: 'Значение справочное',
  useEditor: useGlobalEditor,
  cellEditable: (editor, row) => globalRowEditable(editor.closed, row.parcode).reference,
  cellValue: globalCellValue,
  changedFields: globalChangedFields,
  readOnlyLabel: (editor, original) => locationReferenceLabel(editor.draft, original),
  valstrMax: VALSTR_MAX,
})
