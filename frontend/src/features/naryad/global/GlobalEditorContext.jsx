import { createContext, useContext } from 'react'

const GlobalEditorContext = createContext(null)

/**
 * Черновик таблицы общих параметров. BaseTable грузит строки сам и не отдаёт их наружу,
 * поэтому правки живут здесь.
 */
export const GlobalEditorProvider = GlobalEditorContext.Provider

export function useGlobalEditor() {
  const ctx = useContext(GlobalEditorContext)
  if (!ctx) {
    throw new Error('useGlobalEditor must be used within GlobalEditorProvider')
  }
  return ctx
}
