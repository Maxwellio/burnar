import { useCallback, useRef } from 'react'

/**
 * Стабильный геттер последнего значения из рендера.
 * Нужен обработчикам, которые читают состояние после await (диалог, запрос).
 */
export default function useLatest(value) {
  const ref = useRef(value)
  ref.current = value
  return useCallback(() => ref.current, [])
}
