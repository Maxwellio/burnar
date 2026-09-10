import NaryadWorkspacePanel from './NaryadWorkspacePanel.jsx'
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
    />
  )
}
