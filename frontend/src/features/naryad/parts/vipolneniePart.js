import { calcOperAction } from '../actions/calc/calcOperAction.js'
import { closePartAction } from '../actions/close/closePartAction.js'
import { importZadanieWorksAction } from '../actions/import/importZadanieWorksAction.js'
import { replaceZadanieAction } from '../actions/replace/replaceZadanieAction.js'
import { rowColorAction } from '../actions/color/rowColorAction.js'
import { addEmptyBlockAction } from '../actions/clipboard/addEmptyBlockAction.js'
import { copyWorkAction } from '../actions/clipboard/copyWorkAction.js'
import { cutWorkAction } from '../actions/clipboard/cutWorkAction.js'
import { pasteWorkAction } from '../actions/clipboard/pasteWorkAction.js'
import { renameBlockAction } from '../actions/clipboard/renameBlockAction.js'
import { deleteBlockAction } from '../actions/delete/deleteBlockAction.js'
import { deleteMarkedWorksAction } from '../actions/delete/deleteMarkedWorksAction.js'
import { lockWorksAction, unlockWorksAction } from '../actions/lock/lockWorksActions.js'
import { openSkvParamsAction } from '../actions/skv/openSkvParamsAction.js'
import { COLUMN_SIZING_KEYS, RIGHT_PANEL_WIDTH_KEYS } from '../naryadPageLayout.js'
import {
  naryadVipolnenieColumns,
  naryadVipolnenieParamColumns,
} from '../workspace/naryadWorkspaceColumns.jsx'

/**
 * Наряд-выполнение (Delphi TfrmComNarVip): колонки плюс «Факт» и «Период»,
 * у работ есть блокировка. Порядок actions — порядок кнопок на панели.
 */
export const vipolneniePart = {
  id: 'vipolnenie',
  actionBarLabel: 'Панель действий выполнения',
  urls: (naryadId) => ({
    tree: `/naryady/${naryadId}/vipolnenie`,
    params: `/naryady/${naryadId}/vipolnenie/params`,
    algorithm: `/naryady/${naryadId}/vipolnenie/algorithm`,
  }),
  treeColumns: naryadVipolnenieColumns,
  paramColumns: naryadVipolnenieParamColumns,
  storage: {
    rightPanel: RIGHT_PANEL_WIDTH_KEYS.vip,
    treeSizing: COLUMN_SIZING_KEYS.vipolnenieTree,
    paramsSizing: COLUMN_SIZING_KEYS.vipolnenieParams,
  },
  features: {
    locks: true,
  },
  skv: {
    title: 'Сквозные параметры выполнения (факт)',
    openLabel: 'Сквозные параметры выполнения',
    columnSizing: COLUMN_SIZING_KEYS.skvVipolnenie,
  },
  actions: [
    openSkvParamsAction,
    importZadanieWorksAction,
    replaceZadanieAction,
    deleteMarkedWorksAction,
    deleteBlockAction,
    cutWorkAction,
    copyWorkAction,
    pasteWorkAction,
    addEmptyBlockAction,
    renameBlockAction,
    closePartAction,
    calcOperAction,
    lockWorksAction,
    unlockWorksAction,
    rowColorAction,
  ],
}
