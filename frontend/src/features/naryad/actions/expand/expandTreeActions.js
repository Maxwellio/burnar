import UnfoldLess from '@mui/icons-material/UnfoldLess'
import UnfoldMore from '@mui/icons-material/UnfoldMore'

/** Раскрыть все узлы дерева вкладки. Пакет сам раскрывает лес из ?expandAll=. */
export const expandAllNodesAction = {
  id: 'expand-all',
  label: 'Раскрыть все',
  icon: UnfoldMore,
  isEnabled: () => true,
  run(ctx) {
    ctx.tree.expandAll()
  },
}

/** Свернуть все узлы до корней. Следующая ветка снова грузится лениво. */
export const collapseAllNodesAction = {
  id: 'collapse-all',
  label: 'Свернуть все',
  icon: UnfoldLess,
  isEnabled: () => true,
  run(ctx) {
    ctx.tree.collapseAll()
  },
}
