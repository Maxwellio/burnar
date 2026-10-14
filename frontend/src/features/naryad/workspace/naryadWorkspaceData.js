/** Фильтр BaseTable параметров: nodeId уходит query-параметром, без выбора — пустой список. */
export function nodeIdFilters(selectedId) {
  if (selectedId == null || selectedId === '') {
    return []
  }
  return [{ id: 'nodeId', value: String(selectedId) }]
}

/** Текст строки состояния дерева; без выбранной записи полоса остаётся пустой. */
export function selectedNodeStatusText(selectedId) {
  if (selectedId == null || selectedId === '') {
    return ''
  }
  return `Код: ${String(selectedId)}`
}

/** Параметры и алгоритм показываются только для единственной выбранной строки. */
export function detailNodeId(selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length !== 1) return null
  const id = selectedIds[0]
  if (id == null || id === '') return null
  return id
}

/** Одна строка — её код, несколько — число выбранных, пустой набор — пустая полоса. */
export function treeSelectionStatusText(selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) return ''
  if (selectedIds.length === 1) return `Код: ${String(selectedIds[0])}`
  return `Выбрано: ${selectedIds.length}`
}

/** Часы как в колонке: до двух знаков, хвостовые нули убираются. Пустое значение — 0. */
export function formatDuration(value) {
  if (value == null || value === '') return '0'
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return number.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

const FOOTER_GAP = '    '

/**
 * Итоги CalcItogsNS всегда стоят в футере. Текст выбора, если он есть, идёт перед ними.
 * Задание — одна общая продолжительность, выполнение — норматив и факт.
 */
export function treeFooterStatusParts(selectedIds, part, totals) {
  const chunks = []
  const selection = treeSelectionStatusText(selectedIds)
  if (selection) chunks.push(selection)
  if (totals) {
    if (part === 'vipolnenie') {
      chunks.push(`Общая нормативная продолжительность: ${formatDuration(totals.normDuration)}`)
      chunks.push(`Общая фактическая продолжительность: ${formatDuration(totals.factDuration)}`)
    } else {
      chunks.push(`Общая продолжительность: ${formatDuration(totals.duration)}`)
    }
  }
  return chunks
}

/** Между соседними кусками футера рисуется вертикальный разделитель. */
export function treeFooterStatusItems(selectedIds, part, totals) {
  return treeFooterStatusParts(selectedIds, part, totals).map((text, index) => ({
    text,
    divider: index > 0,
  }))
}

export function treeFooterStatusText(selectedIds, part, totals) {
  return treeFooterStatusParts(selectedIds, part, totals).join(FOOTER_GAP)
}
