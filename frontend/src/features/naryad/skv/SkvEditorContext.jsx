import { createContext, useContext } from 'react'

const SkvEditorContext = createContext(null)

/**
 * Черновик окна для ячеек таблицы. BaseTable сам загружает строки и не отдаёт их наружу,
 * поэтому правки живут здесь, а не в данных таблицы.
 */
export const SkvEditorProvider = SkvEditorContext.Provider

export function useSkvEditor() {
  const ctx = useContext(SkvEditorContext)
  if (!ctx) {
    throw new Error('useSkvEditor must be used within SkvEditorProvider')
  }
  return ctx
}
