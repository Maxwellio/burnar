import { createContext, useContext } from 'react'

/**
 * Состояние одной вкладки (задания или выполнения) для её кнопок и панелей.
 * Контекст на экземпляр, а не глобальный: обе вкладки живут одновременно
 * и не должны видеть выбор и блокировку друг друга.
 */
const NaryadWorkspaceContext = createContext(null)

export const NaryadWorkspaceProvider = NaryadWorkspaceContext.Provider

export function useNaryadWorkspace() {
  const ctx = useContext(NaryadWorkspaceContext)
  if (!ctx) {
    throw new Error('useNaryadWorkspace must be used within NaryadWorkspaceProvider')
  }
  return ctx
}
