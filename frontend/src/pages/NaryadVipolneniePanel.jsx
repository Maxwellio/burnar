import NaryadWorkspacePanel from './NaryadWorkspacePanel.jsx'
import { COLUMN_SIZING_KEYS, RIGHT_PANEL_WIDTH_KEYS } from './naryadPageLayout.js'
import {
  naryadVipolnenieColumns,
  naryadVipolnenieParamColumns,
} from './naryadWorkspaceColumns.jsx'

/** Вкладка «Выполнение»: отдельный инстанс таблиц, колонки плюс «Факт» и «Период». */
export default function NaryadVipolneniePanel({ naryadId }) {
  return (
    <NaryadWorkspacePanel
      actionBarAriaLabel="Панель действий выполнения"
      treeUrl={`/naryady/${naryadId}/vipolnenie`}
      treeColumns={naryadVipolnenieColumns}
      paramsUrl={`/naryady/${naryadId}/vipolnenie/params`}
      paramColumns={naryadVipolnenieParamColumns}
      rightPanelStorageKey={RIGHT_PANEL_WIDTH_KEYS.vip}
      treeSizingKey={COLUMN_SIZING_KEYS.vipolnenieTree}
      paramsSizingKey={COLUMN_SIZING_KEYS.vipolnenieParams}
    />
  )
}
