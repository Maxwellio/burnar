import NaryadWorkspacePanel from './NaryadWorkspacePanel.jsx'
import { naryadVipolnenieColumns } from './naryadVipolnenieColumns.jsx'

/** Вкладка «Выполнение»: тот же лейаут, дерево факта (плюс «Факт» и «Период»). */
export default function NaryadVipolneniePanel({ naryadId }) {
  return (
    <NaryadWorkspacePanel
      actionBarAriaLabel="Панель действий выполнения"
      treeUrl={`/naryady/${naryadId}/vipolnenie`}
      treeColumns={naryadVipolnenieColumns}
      paramsUrl={`/naryady/${naryadId}/vipolnenie/params`}
    />
  )
}
