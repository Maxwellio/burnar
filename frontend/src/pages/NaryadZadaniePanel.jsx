import NaryadWorkspacePanel from './NaryadWorkspacePanel.jsx'
import { COLUMN_SIZING_KEYS, RIGHT_PANEL_WIDTH_KEYS } from './naryadPageLayout.js'
import {
  naryadZadanieColumns,
  naryadZadanieParamColumns,
} from './naryadWorkspaceColumns.jsx'

/** Вкладка «Задание»: своё дерево, свои колонки и своя таблица параметров. */
export default function NaryadZadaniePanel({ naryadId, closed }) {
  return (
    <NaryadWorkspacePanel
      actionBarAriaLabel="Панель действий задания"
      naryadId={naryadId}
      part="zadanie"
      closed={closed}
      treeUrl={`/naryady/${naryadId}/zadanie`}
      treeColumns={naryadZadanieColumns}
      paramsUrl={`/naryady/${naryadId}/zadanie/params`}
      algorithmUrl={`/naryady/${naryadId}/zadanie/algorithm`}
      paramColumns={naryadZadanieParamColumns}
      rightPanelStorageKey={RIGHT_PANEL_WIDTH_KEYS.zad}
      treeSizingKey={COLUMN_SIZING_KEYS.zadanieTree}
      paramsSizingKey={COLUMN_SIZING_KEYS.zadanieParams}
    />
  )
}
