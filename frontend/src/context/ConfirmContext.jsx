import { createContext, useCallback, useContext, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

const ConfirmContext = createContext(null)

const DEFAULT_ACTION = 'удаление'

const CONFIRM_DEFAULTS = {
  confirmLabel: 'Удалить',
  cancelLabel: 'Отмена',
  confirmColor: 'error',
}

/**
 * Глобальные подтверждения и предупреждения: await confirm(...) → boolean,
 * await alert(message) — диалог без кнопки «Удалить».
 * Подключать в App вокруг маршрутов; UI — ConfirmDialog на DraggableDialog.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: CONFIRM_DEFAULTS.confirmLabel,
    cancelLabel: CONFIRM_DEFAULTS.cancelLabel,
    confirmColor: CONFIRM_DEFAULTS.confirmColor,
  })
  const resolveRef = useRef(null)

  const close = useCallback((result) => {
    setState((prev) => ({ ...prev, open: false }))
    const resolve = resolveRef.current
    resolveRef.current = null
    resolve?.(result)
  }, [])

  const confirm = useCallback((message, options = {}) => {
    const {
      action = DEFAULT_ACTION,
      confirmLabel = CONFIRM_DEFAULTS.confirmLabel,
      cancelLabel = CONFIRM_DEFAULTS.cancelLabel,
    } = options

    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({
        open: true,
        title: `Подтвердите ${action}`,
        message,
        confirmLabel,
        cancelLabel,
        confirmColor: CONFIRM_DEFAULTS.confirmColor,
      })
    })
  }, [])

  const alert = useCallback((message, options = {}) => {
    const { title = 'Внимание', confirmLabel = 'ОК' } = options
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({
        open: true,
        title,
        message,
        confirmLabel,
        cancelLabel: null,
        confirmColor: 'primary',
      })
    })
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        confirmColor={state.confirmColor}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  )
}

function useConfirmContext() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return ctx
}

export function useConfirm() {
  return useConfirmContext().confirm
}

export function useAlert() {
  return useConfirmContext().alert
}
