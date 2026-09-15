/**
 * Поля строки состояния BaseTreeTable.
 * Чтобы добавить поле: флаг в объекте statusBar + запись в этот список.
 * Футер виден, если проп statusBar передан (даже пустым объектом).
 */
export const TREE_STATUS_BAR_FIELDS = [
  {
    key: 'selectedId',
    render: ({ selectedRowId } = {}) =>
      selectedRowId == null || selectedRowId === '' ? null : `Код: ${selectedRowId}`,
  },
]

export function isTreeStatusBarVisible(statusBar) {
  return statusBar != null
}

export function getTreeStatusBarParts(statusBar, ctx = {}) {
  if (!isTreeStatusBarVisible(statusBar)) {
    return []
  }
  return TREE_STATUS_BAR_FIELDS.flatMap((field) => {
    if (!statusBar[field.key]) {
      return []
    }
    const part = field.render(ctx)
    return part == null || part === '' ? [] : [part]
  })
}
