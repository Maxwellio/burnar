import { useEffect, useRef } from 'react'
import {
  persistTableColumnSizing,
  seedTableColumnSizing,
} from '../../naryadPageLayout.js'

/**
 * Общая для всех нарядов раскладка колонок таблиц пакета.
 * Пакет хранит ширины под `table-column-sizing:${url}`, а url содержит id наряда.
 * Засев идёт в рендере, до монтирования таблиц; копия обратно — после отпускания
 * кнопки мыши и при размонтировании.
 *
 * @param {Array<[string, string]>} entries пары [url таблицы, стабильный ключ]
 */
export default function useColumnSizingPersistence(entries) {
  const seededRef = useRef(false)
  if (!seededRef.current) {
    for (const [url, key] of entries) seedTableColumnSizing(url, key)
    seededRef.current = true
  }

  const entriesKey = JSON.stringify(entries)

  useEffect(() => {
    const list = JSON.parse(entriesKey)
    const persist = () => {
      for (const [url, key] of list) persistTableColumnSizing(url, key)
    }
    window.addEventListener('pointerup', persist)
    return () => {
      window.removeEventListener('pointerup', persist)
      persist()
    }
  }, [entriesKey])
}
