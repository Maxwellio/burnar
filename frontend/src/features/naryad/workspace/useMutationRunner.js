import { useCallback, useRef, useState } from 'react'

/**
 * Одна блокировка «идёт запрос» на всю вкладку: пока она взята, остальные
 * изменения не стартуют. Флаг дублируется в ref, чтобы повторный клик в том же
 * кадре не прошёл до перерисовки.
 */
export default function useMutationRunner(showAlert) {
  const pendingRef = useRef(false)
  const [pending, setPending] = useState(false)

  const acquire = useCallback(() => {
    if (pendingRef.current) return false
    pendingRef.current = true
    setPending(true)
    return true
  }, [])

  const release = useCallback(() => {
    pendingRef.current = false
    setPending(false)
  }, [])

  const isPending = useCallback(() => pendingRef.current, [])

  /** Ошибка показывается текстом сервера; onDone вызывается и после успеха, и после ошибки. */
  const run = useCallback(async (work, { onDone } = {}) => {
    if (!acquire()) return
    try {
      await work()
      onDone?.()
    } catch (error) {
      void showAlert(error?.message || 'Операция не выполнена')
      onDone?.()
    } finally {
      release()
    }
  }, [acquire, release, showAlert])

  return { pending, isPending, acquire, release, run }
}
