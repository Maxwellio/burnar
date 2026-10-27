import { useMemo } from 'react'
import Box from '@mui/material/Box'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import { naryadCompactTableSx, RIGHT_PANEL_DEFAULT_RATIO } from '../naryadPageLayout.js'
import PanelSplitter from './layout/PanelSplitter.jsx'
import useColumnSizingPersistence from './layout/useColumnSizingPersistence.js'
import useResizablePanel from './layout/useResizablePanel.js'
import { NaryadWorkspaceProvider } from './NaryadWorkspaceContext.jsx'
import { CUT_MARK_COLOR, isCutMarked } from '../actions/clipboard/clipboardRules.js'
import { nodeIdFilters, treeFooterStatusItems } from './naryadWorkspaceData.js'
import TreeStatusBar from './TreeStatusBar.jsx'
import useNaryadWorkspaceState from './useNaryadWorkspaceState.js'
import WorkDetailsPanel from './WorkDetailsPanel.jsx'
import WorkspaceActionBar from './WorkspaceActionBar.jsx'
import WorkspaceActions from './WorkspaceActions.jsx'

const TREE_INITIAL_STATE = { pagination: { pageIndex: 0, pageSize: 10000 } }

/**
 * Вкладка карточки: панель действий / дерево / сплиттер / параметры + алгоритм.
 * Задание и выполнение — разные экземпляры, чтобы ресайз колонок не тёк.
 * Чем части отличаются (url, колонки, ключи storage, набор кнопок), задаёт part из parts/.
 */
export default function NaryadWorkspacePanel({
  part,
  naryadId,
  closed,
  onClosedChange,
  hasVipolnenie,
  onVipolnenieCreated,
  onZadanieReplaced,
  externalReloadSignal,
  onOpenSkv,
}) {
  const workspace = useNaryadWorkspaceState({
    naryadId,
    part,
    closed,
    onClosedChange,
    hasVipolnenie,
    onVipolnenieCreated,
    onZadanieReplaced,
    externalReloadSignal,
    onOpenSkv,
  })
  const { urls, tree, colors } = workspace
  useColumnSizingPersistence([
    [urls.tree, part.storage.treeSizing],
    [urls.params, part.storage.paramsSizing],
  ])
  const rightPanel = useResizablePanel(part.storage.rightPanel)
  const paramFilters = useMemo(() => nodeIdFilters(tree.detailId), [tree.detailId])

  return (
    <NaryadWorkspaceProvider value={workspace}>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <WorkspaceActionBar ariaLabel={part.actionBarLabel}>
          <WorkspaceActions actions={part.actions} />
        </WorkspaceActionBar>

        <Box
          ref={rightPanel.containerRef}
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <AxiosProvider baseapi="/api">
            <Box
              sx={{
                flex: '1 1 0',
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden', ...naryadCompactTableSx }}>
                <BaseTreeTable
                  url={urls.tree}
                  columns={part.treeColumns}
                  multiSelect
                  {...tree.tableProps}
                  getRowBackgroundColor={(row) => (
                    isCutMarked(workspace.clipboard, row?.id)
                      ? CUT_MARK_COLOR
                      : colors.getRowBackgroundColor(row)
                  )}
                  initialState={TREE_INITIAL_STATE}
                />
              </Box>
              <TreeStatusBar
                items={treeFooterStatusItems(tree.selectedIds, part.id, workspace.totals)}
              />
            </Box>

            <PanelSplitter
              ariaLabel="Ширина панели параметров"
              dragging={rightPanel.dragging}
              onPointerDown={rightPanel.onSplitterPointerDown}
            />

            <Box
              sx={{
                width: rightPanel.width ?? `${RIGHT_PANEL_DEFAULT_RATIO * 100}%`,
                flexShrink: 0,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <WorkDetailsPanel
                paramsUrl={urls.params}
                paramColumns={part.paramColumns}
                paramFilters={paramFilters}
                reloadSignal={workspace.paramsReloadSignal}
                algorithm={workspace.algorithm}
              />
            </Box>
          </AxiosProvider>
        </Box>
      </Box>
    </NaryadWorkspaceProvider>
  )
}
