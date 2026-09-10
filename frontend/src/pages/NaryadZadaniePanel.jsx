import NaryadWorkspacePanel from './NaryadWorkspacePanel.jsx'
import {
  naryadZadanieColumns,
  naryadZadanieParamColumns,
} from './naryadWorkspaceColumns.jsx'

/** Вкладка «Задание»: своё дерево, свои колонки и своя таблица параметров. */
export default function NaryadZadaniePanel({ naryadId }) {
  return (
    <NaryadWorkspacePanel
      actionBarAriaLabel="Панель действий задания"
      treeUrl={`/naryady/${naryadId}/zadanie`}
      treeColumns={naryadZadanieColumns}
      paramsUrl={`/naryady/${naryadId}/zadanie/params`}
      paramColumns={naryadZadanieParamColumns}
    />
  )
}
