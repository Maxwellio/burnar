import { calcOperAction } from '../actions/calc/calcOperAction.js'
import { closePartAction } from '../actions/close/closePartAction.js'
import { createEmptyVipolnenieAction } from '../actions/create/createEmptyVipolnenieAction.js'
import { rowColorAction } from '../actions/color/rowColorAction.js'
import { addEmptyBlockAction } from '../actions/clipboard/addEmptyBlockAction.js'
import { copyWorkAction } from '../actions/clipboard/copyWorkAction.js'
import { cutWorkAction } from '../actions/clipboard/cutWorkAction.js'
import { pasteWorkAction } from '../actions/clipboard/pasteWorkAction.js'
import { renameBlockAction } from '../actions/clipboard/renameBlockAction.js'
import { deleteBlockAction } from '../actions/delete/deleteBlockAction.js'
import { deleteMarkedWorksAction } from '../actions/delete/deleteMarkedWorksAction.js'
import { openSkvParamsAction } from '../actions/skv/openSkvParamsAction.js'
import { COLUMN_SIZING_KEYS, RIGHT_PANEL_WIDTH_KEYS } from '../naryadPageLayout.js'
import {
  naryadZadanieColumns,
  naryadZadanieParamColumns,
} from '../workspace/naryadWorkspaceColumns.jsx'

/** Наряд-задание (Delphi TfrmComNarZad). Порядок actions — порядок кнопок на панели. */
export const zadaniePart = {
  id: 'zadanie',
  actionBarLabel: 'Панель действий задания',
  urls: (naryadId) => ({
    tree: `/naryady/${naryadId}/zadanie`,
    params: `/naryady/${naryadId}/zadanie/params`,
    algorithm: `/naryady/${naryadId}/zadanie/algorithm`,
  }),
  treeColumns: naryadZadanieColumns,
  paramColumns: naryadZadanieParamColumns,
  storage: {
    rightPanel: RIGHT_PANEL_WIDTH_KEYS.zad,
    treeSizing: COLUMN_SIZING_KEYS.zadanieTree,
    paramsSizing: COLUMN_SIZING_KEYS.zadanieParams,
  },
  features: {
    locks: false,
  },
  skv: {
    title: 'Сквозные параметры задания (план)',
    openLabel: 'Сквозные параметры задания',
    columnSizing: COLUMN_SIZING_KEYS.skvZadanie,
  },
  actions: [
    openSkvParamsAction,
    createEmptyVipolnenieAction,
    deleteMarkedWorksAction,
    deleteBlockAction,
    cutWorkAction,
    copyWorkAction,
    pasteWorkAction,
    addEmptyBlockAction,
    renameBlockAction,
    closePartAction,
    calcOperAction,
    rowColorAction,
  ],
}
