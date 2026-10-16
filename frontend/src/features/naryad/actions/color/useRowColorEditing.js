import { useCallback, useEffect, useRef, useState } from 'react'
import { updateNaryadRowsColor } from '../../../../api/naryadyApi.js'
import useLatest from '../../workspace/useLatest.js'
import {
  NARYAD_DEFAULT_PICKER_COLOR,
  canChangeRowColor,
  colorOverrideBaselines,
  cssColorToDelphi,
  readRecentRowColors,
  rememberRecentRowColor,
  rowBackgroundColor,
  withRowColorOverrides,
  withoutUnsavedColorOverrides,
  writeRecentRowColors,
} from './naryadRowColors.js'

/**
 * Цветовая маркировка выбранных строк (Delphi actSelelColorRow / actClearColor).
 *
 * Сохранения идут очередью из одного места: пока запрос в полёте, новые оттенки
 * только перезаписывают desired, а после ответа уходит последний. Пока цвет
 * пишется, общая блокировка вкладки занята, как у остальных изменений.
 * Фон после сохранения держится локально в overrides, дерево не перечитывается.
 */
export default function useRowColorEditing({
  naryadId,
  part,
  resetKey,
  tree,
  closed,
  mutation,
  showAlert,
}) {
  const [overrides, setOverrides] = useState(() => new Map())
  const [menuAnchor, setMenuAnchorState] = useState(null)
  const [recentColors, setRecentColors] = useState(() => readRecentRowColors())
  const getOverrides = useLatest(overrides)
  const getClosed = useLatest(closed)
  const menuAnchorRef = useRef(null)
  const recentColorsRef = useRef(recentColors)
  recentColorsRef.current = recentColors
  const desiredColorRef = useRef(null)
  const customPreviewBaselineRef = useRef(null)
  const ignoreCustomInputRef = useRef(false)
  const colorInputRef = useRef(null)
  const colorChangeListenerRef = useRef(null)
  const { getSelectedIds, clearHighlight, selectedIds } = tree

  const setMenuAnchor = useCallback((anchor) => {
    menuAnchorRef.current = anchor
    setMenuAnchorState(anchor)
  }, [])

  useEffect(() => {
    setOverrides(new Map())
    setMenuAnchor(null)
  }, [resetKey, setMenuAnchor])

  useEffect(() => {
    if (selectedIds.length === 0 || closed === true) setMenuAnchor(null)
  }, [selectedIds, closed, setMenuAnchor])

  useEffect(() => {
    if (!menuAnchor) return
    const stored = readRecentRowColors()
    recentColorsRef.current = stored
    setRecentColors(stored)
  }, [menuAnchor])

  const revertCustomPreview = () => {
    const baseline = customPreviewBaselineRef.current
    customPreviewBaselineRef.current = null
    if (!baseline) return
    setOverrides((current) => withoutUnsavedColorOverrides(current, baseline.baselines))
  }

  const drainColorSaves = async () => {
    if (mutation.isPending()) return false
    const job = desiredColorRef.current
    if (!job) return false
    if (!canChangeRowColor(job.nodeIds, getClosed(), false)) {
      desiredColorRef.current = null
      return false
    }
    desiredColorRef.current = null
    mutation.acquire()
    let saved = false
    try {
      const updated = await updateNaryadRowsColor(naryadId, part, job.nodeIds, job.color)
      setOverrides((current) => {
        if (desiredColorRef.current) return current
        return withRowColorOverrides(current, updated.nodeIds ?? job.nodeIds, updated.color)
      })
      // Синяя подсветка скрывает фон, но набор строк остаётся целью кнопок:
      // цвет можно подбирать повторно, не выбирая их заново.
      clearHighlight()
      if (job.closeMenu) setMenuAnchor(null)
      if (!desiredColorRef.current) customPreviewBaselineRef.current = null
      saved = true
    } catch {
      if (!desiredColorRef.current) revertCustomPreview()
      void showAlert('Не удалось изменить цвет выбранных строк.')
    } finally {
      mutation.release()
    }
    if (desiredColorRef.current) void drainColorSavesRef.current()
    return saved
  }
  const drainColorSavesRef = useRef(drainColorSaves)
  drainColorSavesRef.current = drainColorSaves

  /** Образец, недавний цвет или 0 (сброс) — сразу в очередь сохранения. */
  const applyColor = (color, { closeMenu = true } = {}) => {
    const nodeIds = [...getSelectedIds()]
    if (!canChangeRowColor(nodeIds, getClosed(), false)) return Promise.resolve(false)
    if (closeMenu) customPreviewBaselineRef.current = null
    desiredColorRef.current = { color, closeMenu, nodeIds }
    return drainColorSaves()
  }

  /** Промежуточный оттенок «Своего цвета»: рисуется сразу и сохраняется, меню не закрывается. */
  const previewCustomColor = (css) => {
    if (ignoreCustomInputRef.current) return
    let color
    try {
      color = cssColorToDelphi(css)
    } catch {
      return
    }
    if (!customPreviewBaselineRef.current) {
      const nodeIds = [...getSelectedIds()]
      if (!canChangeRowColor(nodeIds, getClosed(), false)) return
      customPreviewBaselineRef.current = {
        baselines: colorOverrideBaselines(getOverrides(), nodeIds),
        nodeIds,
      }
    }
    const nodeIds = customPreviewBaselineRef.current.nodeIds
    setOverrides((current) => withRowColorOverrides(current, nodeIds, color))
    clearHighlight()
    desiredColorRef.current = { color, closeMenu: false, nodeIds: [...nodeIds] }
    void drainColorSavesRef.current()
  }

  /** ref-колбэк для input type="color": change слушается нативно, а не через React. */
  const bindColorInput = useCallback((node) => {
    const previous = colorInputRef.current
    if (previous === node) return
    if (previous && colorChangeListenerRef.current) {
      previous.removeEventListener('change', colorChangeListenerRef.current)
    }
    colorInputRef.current = node
    if (!node) {
      colorChangeListenerRef.current = null
      return
    }
    // change приходит, когда системный селектор уже закрыт. До этого input
    // только показывает оттенок и не должен размонтировать поле.
    const commit = (event) => {
      const css = event.target.value
      ignoreCustomInputRef.current = true
      event.target.value = NARYAD_DEFAULT_PICKER_COLOR
      ignoreCustomInputRef.current = false
      let color
      try {
        color = cssColorToDelphi(css)
      } catch {
        return
      }
      const nextRecent = rememberRecentRowColor(recentColorsRef.current, css)
      if (nextRecent !== recentColorsRef.current) {
        recentColorsRef.current = nextRecent
        writeRecentRowColors(nextRecent)
        setRecentColors(nextRecent)
      }
      const preview = customPreviewBaselineRef.current
      const nodeIds = preview?.nodeIds ? [...preview.nodeIds] : [...getSelectedIds()]
      if (!canChangeRowColor(nodeIds, getClosed(), false)) return
      desiredColorRef.current = {
        color,
        closeMenu: true,
        nodeIds,
      }
      void drainColorSavesRef.current()
    }
    colorChangeListenerRef.current = commit
    node.addEventListener('change', commit)
  }, [getSelectedIds, getClosed])

  const getRowBackgroundColor = useCallback(
    (row) => rowBackgroundColor(row, overrides),
    [overrides],
  )

  return {
    enabled: canChangeRowColor(selectedIds, closed, mutation.pending),
    getRowBackgroundColor,
    menuAnchor,
    isMenuOpen: () => Boolean(menuAnchorRef.current),
    openMenu: setMenuAnchor,
    closeMenu: () => setMenuAnchor(null),
    recentColors,
    applyColor,
    previewCustomColor,
    bindColorInput,
  }
}
