import { closePartAction } from '../actions/close/closePartAction.js'
import { createEmptyVipolnenieAction } from '../actions/create/createEmptyVipolnenieAction.js'
import { rowColorAction } from '../actions/color/rowColorAction.js'
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
  },
  actions: [
    openSkvParamsAction,
    createEmptyVipolnenieAction,
    deleteMarkedWorksAction,
    deleteBlockAction,
    closePartAction,
    rowColorAction,
  ],
}
