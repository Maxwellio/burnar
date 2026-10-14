import { useEffect, useState } from 'react'
import useLatest from './useLatest.js'

/**
 * Значение, загружаемое по зависимостям. Ответ устаревшего запроса отбрасывается,
 * ошибка загрузки даёт empty.
 *
 * clearOnRefetch: false оставляет прежнее значение, пока идёт новый запрос
 * (итоги, текст алгоритма). Данные, на которые опираются кнопки, лучше сбрасывать.
 * resetKey: при смене сбрасывает значение даже при clearOnRefetch: false.
 */
export default function useAsyncValue(load, deps, {
  enabled = true,
  empty = null,
  clearOnRefetch = true,
  resetKey,
} = {}) {
  const [value, setValue] = useState(empty)
  const getLoad = useLatest(load)
  const getEmpty = useLatest(empty)

  useEffect(() => {
    setValue(getEmpty())
  }, [resetKey, getEmpty])

  useEffect(() => {
    if (!enabled) {
      setValue(getEmpty())
      return undefined
    }
    let cancelled = false
    if (clearOnRefetch) setValue(getEmpty())
    Promise.resolve()
      .then(() => getLoad()())
      .then((data) => {
        if (!cancelled) setValue(data ?? getEmpty())
      })
      .catch(() => {
        if (!cancelled) setValue(getEmpty())
      })
    return () => {
      cancelled = true
    }
  }, [enabled, clearOnRefetch, getLoad, getEmpty, ...deps])

  return value
}
