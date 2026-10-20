import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Close from '@mui/icons-material/Close'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import OpenInNew from '@mui/icons-material/OpenInNew'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ruRU } from '@mui/x-date-pickers/locales'
import { format, isValid, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AxiosProvider, BaseTable } from 'mainComponent'
import { fetchNaryadSkvHeader, fetchNaryadSkvValues, saveNaryadSkv } from '../../../api/naryadyApi.js'
import useColumnSizingPersistence from '../workspace/layout/useColumnSizingPersistence.js'
import DraggableDialog from '../../../components/DraggableDialog'
import { useAlert, useConfirm } from '../../../context/ConfirmContext.jsx'
import { SkvEditorProvider } from './SkvEditorContext.jsx'
import { skvParamColumns } from './skvParamColumns.jsx'
import {
  SKV_BEG_DATE_REQUIRED,
  SKV_CONFIRM_MESSAGE,
  SKV_SAVED_MESSAGE,
  SKV_UNSAVED_CLOSE_MESSAGE,
  applySkvEdit,
  buildSkvSavePayload,
  canSaveSkv,
  invalidSkvNumbers,
  isSkvDirty,
  skvNeedsResetConfirm,
} from './skvRules.js'

export const SKV_DIALOG_WIDTH = 1100
export const SKV_DIALOG_HEIGHT_RATIO = 0.7

const noopSetFilters = () => {}

/** ::after в колонке MUI добавляет пустую прокрутку почти на высоту списка. */
const clockSectionSx = {
  '& .MuiMultiSectionDigitalClockSection-root': {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
    '&::after': { content: 'none', height: 0 },
  },
}

function SkvBegDateField({ value, onChange, readOnly }) {
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={ru}
      localeText={ruRU.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <DesktopDateTimePicker
        label="Дата и время начала работ"
        value={value ? parseISO(value) : null}
        onChange={(next) => {
          onChange(next && isValid(next) ? format(next, "yyyy-MM-dd'T'HH:mm:ss") : null)
        }}
        format="dd.MM.yyyy HH:mm"
        ampm={false}
        views={['year', 'month', 'day', 'hours', 'minutes']}
        timeSteps={{ hours: 1, minutes: 1 }}
        readOnly={readOnly}
        disabled={readOnly}
        minDateTime={new Date(2000, 0, 1)}
        maxDateTime={new Date(2101, 0, 1)}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            InputLabelProps: { shrink: true },
          },
          popper: { sx: clockSectionSx },
          desktopPaper: { sx: clockSectionSx },
        }}
      />
    </LocalizationProvider>
  )
}

const titleButtonSx = { color: 'text.secondary' }

/**
 * Окно сквозных параметров одной части наряда (Delphi formSkvZadVar / formSkvVipVar).
 * Немодальное: рядом может быть открыто окно другой части, страницу закрывает
 * общая подложка из SkvParamsWindows. Черновик живёт, пока окно открыто.
 *
 * @param {object} props
 * @param {object} props.part описание части из parts/ (id, skv.title)
 * @param {object|null} props.otherPart часть, чьё окно можно открыть рядом, или null
 */
export default function SkvParamsDialog({
  naryadId,
  nameNar,
  part,
  otherPart,
  initialPosition,
  zIndex,
  paperRef,
  onActivate,
  onOpenOther,
  onClose,
  onSaved,
}) {
  const confirm = useConfirm()
  const showAlert = useAlert()
  const [header, setHeader] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [begDate, setBegDate] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [tableSignal, setTableSignal] = useState(0)

  const partId = part.id
  const titleId = `skv-dialog-title-${partId}`
  const paramsUrl = `/naryady/${naryadId}/${partId}/skv/params`
  useColumnSizingPersistence([[paramsUrl, part.skv.columnSizing]])
  const valueRequests = useRef(new Map())
  const readOnly = header?.readOnly === true
  const dirty = isSkvDirty({ savedBegDate: header?.begDate, begDate, draft })
  const badNumbers = invalidSkvNumbers(draft).length > 0
  const saveEnabled = canSaveSkv({
    loaded: header != null,
    readOnly,
    saving,
    begDate,
    dirty,
    draft,
  })

  const loadHeader = useCallback(async () => {
    setLoadError('')
    try {
      const next = await fetchNaryadSkvHeader(naryadId, partId)
      setHeader(next)
      setBegDate(next?.begDate ?? null)
    } catch (error) {
      setLoadError(error?.message || 'Не удалось загрузить сквозные параметры')
    }
  }, [naryadId, partId])

  useEffect(() => {
    void loadHeader()
  }, [loadHeader])

  const setCell = useCallback((row, field, value) => {
    setDraft((prev) => applySkvEdit(prev, row, field, value))
  }, [])

  /** Один запрос на параметр, пока окно открыто; ошибку не кешируем. */
  const loadValues = useCallback((parcode) => {
    const key = String(parcode)
    if (!valueRequests.current.has(key)) {
      const request = fetchNaryadSkvValues(naryadId, partId, parcode).catch((error) => {
        valueRequests.current.delete(key)
        throw error
      })
      valueRequests.current.set(key, request)
    }
    return valueRequests.current.get(key)
  }, [naryadId, partId])

  const editor = useMemo(
    () => ({ readOnly: readOnly || saving, draft, setCell, loadValues }),
    [readOnly, saving, draft, setCell, loadValues],
  )

  const requestClose = async () => {
    if (saving) return
    if (dirty && !readOnly) {
      const accepted = await confirm(SKV_UNSAVED_CLOSE_MESSAGE, {
        action: 'закрытие',
        confirmLabel: 'Закрыть',
      })
      if (!accepted) return
    }
    onClose()
  }

  const handleSave = async () => {
    if (!saveEnabled) return
    if (skvNeedsResetConfirm(draft)) {
      const accepted = await confirm(SKV_CONFIRM_MESSAGE, {
        action: 'изменение',
        confirmLabel: 'Сохранить',
      })
      if (!accepted) return
    }
    setSaving(true)
    try {
      const result = await saveNaryadSkv(naryadId, partId, buildSkvSavePayload(begDate, draft))
      setDraft({})
      setTableSignal((value) => value + 1)
      await loadHeader()
      onSaved?.(partId, result)
      await showAlert(SKV_SAVED_MESSAGE)
    } catch (error) {
      await showAlert(error?.message || 'Не удалось сохранить сквозные параметры')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DraggableDialog
      open
      modeless
      initialPosition={initialPosition}
      zIndex={zIndex}
      onActivate={onActivate}
      onClose={() => { void requestClose() }}
      aria-labelledby={titleId}
      maxWidth={false}
      PaperProps={{
        ref: paperRef,
        sx: {
          width: SKV_DIALOG_WIDTH,
          maxWidth: 'calc(100vw - 32px)',
          height: `${SKV_DIALOG_HEIGHT_RATIO * 100}vh`,
          m: 2,
        },
      }}
    >
      <DialogTitle
        id={titleId}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1, py: 1.25 }}
      >
        <Typography component="span" variant="h6" noWrap sx={{ flex: 1, minWidth: 0, fontSize: '1.1rem' }}>
          {`${part.skv.title}: ${nameNar || naryadId}`}
        </Typography>
        {otherPart ? (
          <Tooltip title={otherPart.skv.openLabel}>
            <IconButton
              aria-label={otherPart.skv.openLabel}
              onClick={onOpenOther}
              sx={titleButtonSx}
            >
              <OpenInNew />
            </IconButton>
          </Tooltip>
        ) : null}
        <Tooltip title="Закрыть">
          <IconButton aria-label="Закрыть" onClick={() => { void requestClose() }} sx={titleButtonSx}>
            <Close />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0, overflow: 'hidden' }}
      >
        {loadError ? <Alert severity="error">{loadError}</Alert> : null}
        {header == null && !loadError ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}
        {header != null ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', pt: 1, flexShrink: 0 }}>
              <Box sx={{ width: 240 }}>
                <SkvBegDateField
                  value={begDate}
                  onChange={setBegDate}
                  readOnly={readOnly || saving}
                />
                {!begDate && !readOnly ? (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, ml: 1.5 }}>
                    {SKV_BEG_DATE_REQUIRED}
                  </Typography>
                ) : null}
              </Box>
              <TextField
                label="Дата закрытия от изменений"
                value={header.closedDate ?? ''}
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                disabled
                sx={{ width: 200 }}
              />
              <FormControlLabel
                control={<Checkbox checked={header.closed === true} disabled size="small" />}
                label="Закрыто от изменений"
                sx={{ mt: 0.5, mr: 0 }}
              />
              {readOnly ? (
                <Tooltip title={`${header.readOnlyReason}. Сквозные параметры доступны только для просмотра.`}>
                  <IconButton
                    aria-label={header.readOnlyReason}
                    size="small"
                    sx={{ mt: 0.5, color: 'text.secondary' }}
                  >
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Box>
            {badNumbers ? (
              <Alert severity="warning" sx={{ flexShrink: 0, py: 0 }}>
                Числовое значение введено неверно
              </Alert>
            ) : null}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                '& .overflow-y-auto': { overflowX: 'auto' },
              }}
            >
              <SkvEditorProvider value={editor}>
                <AxiosProvider baseapi="/api">
                  <BaseTable
                    url={paramsUrl}
                    columns={skvParamColumns}
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
              </SkvEditorProvider>
            </Box>
          </>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button variant="outlined" color="inherit" onClick={() => { void requestClose() }} disabled={saving}>
          Отмена
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => { void handleSave() }}
          disabled={!saveEnabled}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Сохранить
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
