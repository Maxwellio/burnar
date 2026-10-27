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
    alternateLabel: null,
    confirmResult: true,
    alternateResult: null,
    choices: null,
    input: null,
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
        alternateLabel: null,
        confirmResult: true,
        alternateResult: null,
        choices: null,
        input: null,
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
        alternateLabel: null,
        confirmResult: true,
        alternateResult: null,
        choices: null,
        input: null,
      })
    })
  }, [])

  /** Кнопки выбора и отмена. Отмена решает null и ничего не вызывает. */
  const choose = useCallback((message, options = {}) => {
    const {
      title = 'Внимание',
      confirmLabel,
      confirmResult,
      alternateLabel,
      alternateResult,
      cancelLabel = 'Отмена',
      choices = null,
    } = options
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({
        open: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        confirmColor: 'primary',
        alternateLabel,
        confirmResult,
        alternateResult,
        choices,
        input: null,
      })
    })
  }, [])

  /**
   * Строка или null, если окно закрыли. Пустая строка возвращается только
   * при allowEmpty: так создаётся блок без имени, а переименование молчит.
   */
  const prompt = useCallback((message, options = {}) => {
    const {
      title = 'Введите название блока',
      confirmLabel = 'ОК',
      cancelLabel = 'Отмена',
      defaultValue = '',
      allowEmpty = false,
      choices = null,
    } = options
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({
        open: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        confirmColor: 'primary',
        alternateLabel: null,
        confirmResult: true,
        alternateResult: null,
        choices,
        input: { defaultValue, allowEmpty },
      })
    })
  }, [])

  const submit = (value) => {
    if (state.input) {
      if (!state.input.allowEmpty && value === '') close(null)
      else close(value)
      return
    }
    close(state.confirmResult ?? true)
  }

  return (
    <ConfirmContext.Provider value={{ confirm, alert, choose, prompt }}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        confirmColor={state.confirmColor}
        alternateLabel={state.alternateLabel}
        choices={state.choices}
        input={state.input}
        onConfirm={submit}
        onAlternate={() => close(state.alternateResult)}
        onChoice={(result, draft) => {
          if (state.input) {
            if (!state.input.allowEmpty && draft === '') close(null)
            else close({ value: draft, place: result })
            return
          }
          close(result)
        }}
        onCancel={() => close(state.input || state.alternateLabel || state.choices ? null : false)}
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

export function useChoose() {
  return useConfirmContext().choose
}

export function usePrompt() {
  return useConfirmContext().prompt
}
