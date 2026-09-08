import NaryadWorkspacePanel from './NaryadWorkspacePanel.jsx'
import { naryadZadanieColumns } from './naryadZadanieColumns.jsx'

/** Вкладка «Задание»: дерево работ плана, параметры операции, поле алгоритма. */
export default function NaryadZadaniePanel({ naryadId }) {
  return (
    <NaryadWorkspacePanel
      actionBarAriaLabel="Панель действий задания"
      treeUrl={`/naryady/${naryadId}/zadanie`}
      treeColumns={naryadZadanieColumns}
      paramsUrl={`/naryady/${naryadId}/zadanie/params`}
    />
  )
}
