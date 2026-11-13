import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Timeline from '@mui/icons-material/Timeline'
import { AxiosProvider, BaseTable } from 'mainComponent'
import DraggableDialog from '../../../../components/DraggableDialog'
import { COLUMN_SIZING_KEYS, naryadCompactTableSx } from '../../naryadPageLayout.js'
import ActionButton from '../../workspace/ActionButton.jsx'
import useColumnSizingPersistence from '../../workspace/layout/useColumnSizingPersistence.js'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import {
  INTERVALS_DIALOG_TITLE,
  INTERVALS_LABEL,
  INTERVAL_TABS,
  intervalColumnDefs,
  intervalRowColor,
} from './intervalRules.js'

const NO_FILTERS = []
const ignoreFilters = () => {}

const SIZING_KEYS = {
  meh: COLUMN_SIZING_KEYS.vipolnenieIntervalsMehbur,
  nar: COLUMN_SIZING_KEYS.vipolnenieIntervalsNar,
}

function paintedColumns(prefix) {
  return intervalColumnDefs(prefix).map((column) => ({
    ...column,
    cell: (info) => {
      const text = column.cell(info)
      const color = intervalRowColor(info.row.original)
      return (
        <Box
          component="span"
          sx={color ? { display: 'block', backgroundColor: color } : undefined}
        >
          {text}
        </Box>
      )
    },
  }))
}

function IntervalTables({ naryadId, tab }) {
  const columns = useMemo(
    () => Object.fromEntries(INTERVAL_TABS.map((item) => [item.prefix, paintedColumns(item.prefix)])),
    [],
  )
  const urls = INTERVAL_TABS.map((item) => `/naryady/${naryadId}/vipolnenie/${item.path}`)
  useColumnSizingPersistence(INTERVAL_TABS.map((item, index) => [urls[index], SIZING_KEYS[item.prefix]]))

  return (
    <AxiosProvider baseapi="/api">
      {INTERVAL_TABS.map((item, index) => (
        <Box
          key={item.path}
          sx={{
            display: tab === index ? 'flex' : 'none',
            flexDirection: 'column',
            flex: 1,
            width: '100%',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
            ...naryadCompactTableSx,
            '& > div': {
              flex: 1,
              width: '100%',
              minWidth: 0,
              minHeight: 0,
            },
          }}
        >
          <BaseTable
            url={urls[index]}
            columns={columns[item.prefix]}
            filters={NO_FILTERS}
            setFilters={ignoreFilters}
            getRowBackgroundColor={intervalRowColor}
          />
        </Box>
      ))}
    </AxiosProvider>
  )
}

function IntervalsDialog({ open, naryadId, onClose }) {
  const [tab, setTab] = useState(0)

  return (
    <DraggableDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { height: '70vh' } }}
    >
      <DialogTitle>{INTERVALS_DIALOG_TITLE}</DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_event, next) => setTab(next)}
          sx={{ flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
        >
          {INTERVAL_TABS.map((item) => (
            <Tab key={item.path} label={item.title} />
          ))}
        </Tabs>
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', mt: 1, display: 'flex', flexDirection: 'column' }}>
          {open ? <IntervalTables naryadId={naryadId} tab={tab} /> : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>ОК</Button>
      </DialogActions>
    </DraggableDialog>
  )
}

/** Delphi actIntervals. Доступна и у закрытого выполнения. */
export function IntervalsButton() {
  const ctx = useNaryadWorkspace()
  const [open, setOpen] = useState(false)

  return (
    <>
      <ActionButton
        label={INTERVALS_LABEL}
        icon={Timeline}
        disabled={false}
        onClick={() => setOpen(true)}
      />
      <IntervalsDialog
        open={open}
        naryadId={ctx.naryadId}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

export const intervalsAction = {
  id: 'check-intervals',
  Component: IntervalsButton,
}
