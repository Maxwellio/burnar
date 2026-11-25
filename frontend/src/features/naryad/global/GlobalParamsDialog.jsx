import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Close from '@mui/icons-material/Close'
import { AxiosProvider, BaseTable } from 'mainComponent'
import { fetchNaryadGlobal, saveNaryadGlobal } from '../../../api/naryadyApi.js'
import DraggableDialog from '../../../components/DraggableDialog'
import { useAlert, useConfirm } from '../../../context/ConfirmContext.jsx'
import useColumnSizingPersistence from '../workspace/layout/useColumnSizingPersistence.js'
import { COLUMN_SIZING_KEYS } from '../naryadPageLayout.js'
import { GlobalEditorProvider } from './GlobalEditorContext.jsx'
import { globalParamColumns } from './globalParamColumns.jsx'
import {
  GLOBAL_SAVED_MESSAGE,
  GLOBAL_UNSAVED_CLOSE_MESSAGE,
  NM_MAX,
  SHIFR_MAX,
  applyGlobalEdit,
  buildGlobalSavePayload,
  canSaveGlobal,
  globalRowEditable,
  globalTextBold,
  invalidGlobalNumbers,
  isGlobalDirty,
  masterNames,
  selectWellType,
  toggleReportParam,
} from './globalRules.js'

const noopSetFilters = () => {}

const fieldSx = { minWidth: 0 }
const DIALOG_WIDTH = 1080

function checkedIds(items) {
  return (items ?? []).filter((item) => item.checked).map((item) => item.id)
}

function ReadOnlyField({ label, value }) {
  return (
    <TextField
      label={label}
      value={value ?? ''}
      size="small"
      fullWidth
      disabled
      InputLabelProps={{ shrink: true }}
      sx={fieldSx}
    />
  )
}

function MastersField({ masters }) {
  const value = masters ?? ''
  const names = masterNames(value)
  return (
    <TextField
      select
      label="Мастер(а)"
      value={value}
      onChange={() => {}}
      size="small"
      fullWidth
      InputLabelProps={{ shrink: true }}
      sx={fieldSx}
    >
      {/* В поле остаётся вся строка getmasters, пункты ниже только показывают имена. */}
      <MenuItem value={value} sx={{ display: 'none' }}>{value || '\u00a0'}</MenuItem>
      {names.map((name, index) => (
        <MenuItem key={`${name}-${index}`} value={`\u0000${index}`}>{name}</MenuItem>
      ))}
    </TextField>
  )
}

function CheckColumn({ title, items, selected, saved, disabled, onToggle }) {
  const savedSet = new Set(saved ?? [])
  const selectedSet = new Set(selected ?? [])
  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, pb: 0.25 }}>
        {title}
      </Typography>
      <Box sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
      >
        {(items ?? []).map((item) => {
          const checked = selectedSet.has(item.id)
          const bold = savedSet.has(item.id) !== checked
          return (
            <FormControlLabel
              key={item.id}
              disabled={disabled}
              sx={{
                display: 'flex',
                mx: 0,
                px: 0.5,
                '& .MuiFormControlLabel-label': { fontWeight: bold ? 700 : 400 },
              }}
              control={(
                <Checkbox
                  size="small"
                  checked={checked}
                  onChange={() => onToggle(item.id)}
                />
              )}
              label={item.name ?? ''}
            />
          )
        })}
      </Box>
    </Box>
  )
}

/**
 * Модальное окно общих параметров наряда (Delphi GlobalVarUnit).
 * Сохранение, ОК и закрытие — одни на всё окно. Поиск скважины пока без действия.
 */
export default function GlobalParamsDialog({ naryadId, onClose, onNameSaved }) {
  const confirm = useConfirm()
  const showAlert = useAlert()
  const [form, setForm] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [ownerNar, setOwnerNar] = useState(null)
  const [savedOwnerNar, setSavedOwnerNar] = useState(null)
  const [shifr, setShifr] = useState('')
  const [savedShifr, setSavedShifr] = useState('')
  const [nm, setNm] = useState('')
  const [savedNm, setSavedNm] = useState('')
  const [wellTypeIds, setWellTypeIds] = useState([])
  const [savedWellTypeIds, setSavedWellTypeIds] = useState([])
  const [reportParamIds, setReportParamIds] = useState([])
  const [savedReportParamIds, setSavedReportParamIds] = useState([])
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [tableSignal, setTableSignal] = useState(0)

  const paramsUrl = `/naryady/${naryadId}/global/params`
  useColumnSizingPersistence([[paramsUrl, COLUMN_SIZING_KEYS.globalParams]])

  const closed = form?.closed === true
  const state = {
    loaded: form != null,
    saving,
    savedOwnerNar,
    ownerNar,
    savedShifr,
    shifr,
    savedNm,
    nm,
    draft,
    savedWellTypeIds,
    wellTypeIds,
    savedReportParamIds,
    reportParamIds,
  }
  const dirty = isGlobalDirty(state)
  const saveEnabled = canSaveGlobal(state)
  const badNumbers = invalidGlobalNumbers(draft).length > 0

  const takeForm = useCallback((next) => {
    const well = checkedIds(next?.wellTypes)
    const report = checkedIds(next?.reportParams)
    setForm(next)
    setOwnerNar(next?.ownerNar ?? null)
    setSavedOwnerNar(next?.ownerNar ?? null)
    setShifr(next?.shifr ?? '')
    setSavedShifr(next?.shifr ?? '')
    setNm(next?.nm ?? '')
    setSavedNm(next?.nm ?? '')
    setWellTypeIds(well)
    setSavedWellTypeIds(well)
    setReportParamIds(report)
    setSavedReportParamIds(report)
    setDraft({})
  }, [])

  const loadForm = useCallback(async () => {
    setLoadError('')
    try {
      takeForm(await fetchNaryadGlobal(naryadId))
      return true
    } catch (error) {
      setLoadError(error?.message || 'Не удалось загрузить общие параметры')
      return false
    }
  }, [naryadId, takeForm])

  useEffect(() => {
    void loadForm()
  }, [loadForm])

  const setCell = useCallback((row, field, value) => {
    const editable = globalRowEditable(closed, row.parcode)
    const allowed = field === 'znval' ? editable.reference : editable.value
    if (!allowed || saving) return
    setDraft((prev) => applyGlobalEdit(prev, row, field, value))
  }, [closed, saving])

  const editor = useMemo(
    () => ({ closed, draft, setCell }),
    [closed, draft, setCell],
  )

  const requestClose = async () => {
    if (saving) return
    if (dirty) {
      const accepted = await confirm(GLOBAL_UNSAVED_CLOSE_MESSAGE, {
        action: 'закрытие',
        confirmLabel: 'Закрыть',
      })
      if (!accepted) return
    }
    onClose()
  }

  const handleSave = async () => {
    if (!saveEnabled) return false
    const payload = buildGlobalSavePayload(state)
    setSaving(true)
    try {
      const result = await saveNaryadGlobal(naryadId, payload)
      if (result?.headerChanged) onNameSaved?.(result?.nameNar ?? '')
      setSavedOwnerNar(ownerNar)
      setSavedShifr(shifr)
      setSavedNm(nm)
      setSavedWellTypeIds(wellTypeIds)
      setSavedReportParamIds(reportParamIds)
      setDraft({})
      setTableSignal((value) => value + 1)
      await loadForm()
      await showAlert(GLOBAL_SAVED_MESSAGE)
      return true
    } catch (error) {
      await showAlert(error?.message || 'Не удалось сохранить общие параметры')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleOk = async () => {
    if (saving) return
    if (!dirty) {
      onClose()
      return
    }
    if (await handleSave()) onClose()
  }

  const locked = closed || saving
  const masters = form?.masters || ''

  return (
    <DraggableDialog
      open
      onClose={() => { void requestClose() }}
      aria-labelledby="global-params-title"
      maxWidth={false}
      PaperProps={{
        sx: {
          width: DIALOG_WIDTH,
          maxWidth: 'calc(100vw - 32px)',
          height: '92vh',
          m: 2,
        },
      }}
    >
      <DialogTitle
        id="global-params-title"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1, py: 1.25 }}
      >
        <Typography component="span" variant="h6" noWrap sx={{ flex: 1, minWidth: 0, fontSize: '1.1rem' }}>
          {`Общая информация по наряду: ${naryadId}`}
        </Typography>
        <Tooltip title="Закрыть">
          <IconButton aria-label="Закрыть" onClick={() => { void requestClose() }} disabled={saving}>
            <Close />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, minHeight: 0, overflow: 'hidden' }}
      >
        {loadError ? <Alert severity="error">{loadError}</Alert> : null}
        {form == null && !loadError ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}
        {form != null ? (
          <>
            {closed ? (
              <Alert severity="info" sx={{ flexShrink: 0, py: 0 }}>
                Наряд закрыт от изменений. Шапка и таблица доступны только для просмотра.
              </Alert>
            ) : null}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 1.25,
              pt: 0.5,
              flexShrink: 0,
            }}
            >
              <TextField
                select
                label="Владелец наряда"
                value={ownerNar == null ? '' : String(ownerNar)}
                onChange={(event) => {
                  setOwnerNar(event.target.value === '' ? null : Number(event.target.value))
                }}
                size="small"
                fullWidth
                disabled={locked}
                InputLabelProps={{ shrink: true }}
                InputProps={{ sx: { fontWeight: ownerNar !== savedOwnerNar ? 700 : 400 } }}
                sx={fieldSx}
              >
                {(form.brigades ?? []).map((item) => (
                  <MenuItem key={item.id} value={String(item.id)}>{item.nm}</MenuItem>
                ))}
              </TextField>
              <ReadOnlyField label="Дата создания в системе" value={form.createdate} />
              <MastersField masters={masters} />
              <ReadOnlyField label="Автор наряда в системе" value={form.authorNm} />
              <TextField
                label="Шифр объекта"
                value={shifr}
                onChange={(event) => setShifr(event.target.value)}
                size="small"
                fullWidth
                disabled={locked}
                InputLabelProps={{ shrink: true }}
                inputProps={{ maxLength: SHIFR_MAX }}
                InputProps={{ sx: { fontWeight: globalTextBold(savedShifr, shifr) } }}
                sx={fieldSx}
              />
              <ReadOnlyField label="Тип наряда" value={form.nartypeNm} />
              <TextField
                label="Наименование наряда"
                value={nm}
                onChange={(event) => setNm(event.target.value)}
                size="small"
                fullWidth
                disabled={locked}
                InputLabelProps={{ shrink: true }}
                inputProps={{ maxLength: NM_MAX }}
                InputProps={{ sx: { fontWeight: globalTextBold(savedNm, nm) } }}
                sx={{ ...fieldSx, gridColumn: '1 / -1' }}
              />
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <Button type="button" variant="outlined" size="small">
                Поиск скважины
              </Button>
            </Box>

            {badNumbers ? (
              <Alert severity="warning" sx={{ flexShrink: 0, py: 0 }}>
                Числовое значение введено неверно
              </Alert>
            ) : null}

            {/* Таблица примерно на 40% короче, эта высота у блока отчёта. */}
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box sx={{
                flex: '3 1 0',
                minHeight: 0,
                minWidth: 0,
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                '& .overflow-y-auto': { overflowX: 'auto' },
                '& td, & th': {
                  whiteSpace: 'normal !important',
                  textOverflow: 'clip !important',
                  overflowWrap: 'anywhere',
                },
              }}
              >
                <GlobalEditorProvider value={editor}>
                  <AxiosProvider baseapi="/api">
                    <BaseTable
                      url={paramsUrl}
                      columns={globalParamColumns}
                      filters={[]}
                      setFilters={noopSetFilters}
                      reRenderSignal={tableSignal}
                      defaultColumn={{
                        enableColumnFilter: false,
                        size: 150,
                        minSize: 40,
                        maxSize: 4000,
                      }}
                      style={{ flex: 1, minWidth: 0, minHeight: 0, width: '100%' }}
                    />
                  </AxiosProvider>
                </GlobalEditorProvider>
              </Box>

              <Box
                component="fieldset"
                sx={{
                  flex: '4 1 0',
                  minHeight: 0,
                  m: 0,
                  px: 1.5,
                  pt: 0.5,
                  pb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                <Typography component="legend" variant="body2" sx={{ px: 0.5 }}>
                  Параметры для отчета &quot;Расчет приведенной проходки&quot;
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minHeight: 0, minWidth: 0 }}>
                  <CheckColumn
                    title="Тип скважины"
                    items={form.wellTypes}
                    selected={wellTypeIds}
                    saved={savedWellTypeIds}
                    disabled={saving}
                    onToggle={(id) => setWellTypeIds((ids) => selectWellType(ids, id))}
                  />
                  <CheckColumn
                    title="Параметры"
                    items={form.reportParams}
                    selected={reportParamIds}
                    saved={savedReportParamIds}
                    disabled={saving}
                    onToggle={(id) => setReportParamIds((ids) => toggleReportParam(ids, id))}
                  />
                </Box>
              </Box>
            </Box>
          </>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button
          variant="contained"
          disableElevation
          onClick={() => { void handleSave() }}
          disabled={!saveEnabled}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Сохранить
        </Button>
        <Button
          variant="outlined"
          onClick={() => { void handleOk() }}
          disabled={saving || (dirty && !saveEnabled)}
        >
          ОК
        </Button>
        <Button variant="outlined" color="inherit" onClick={() => { void requestClose() }} disabled={saving}>
          Закрыть
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
