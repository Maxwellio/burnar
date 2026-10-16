import ActionButton from './ActionButton.jsx'
import { useNaryadWorkspace } from './NaryadWorkspaceContext.jsx'

/**
 * Кнопки панели вкладки по списку part.actions.
 *
 * Действие — либо кнопка { id, label | getLabel, icon | getIcon, isEnabled, run },
 * где функции получают контекст вкладки, либо { id, Component } со своим
 * интерфейсом (палитра, диалог), который сам берёт контекст.
 * isVisible скрывает кнопку целиком (замена задания видна только org 1 и 8).
 */
export default function WorkspaceActions({ actions }) {
  const ctx = useNaryadWorkspace()
  return actions.map((action) => {
    if (typeof action.isVisible === 'function' && !action.isVisible(ctx)) {
      return null
    }
    if (action.Component) {
      const { Component } = action
      return <Component key={action.id} />
    }
    return (
      <ActionButton
        key={action.id}
        label={action.getLabel ? action.getLabel(ctx) : action.label}
        icon={action.getIcon ? action.getIcon(ctx) : action.icon}
        disabled={!action.isEnabled(ctx)}
        onClick={() => {
          void action.run(ctx)
        }}
      />
    )
  })
}
