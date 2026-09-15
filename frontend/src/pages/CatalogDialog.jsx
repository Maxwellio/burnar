import { useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import UnfoldLess from '@mui/icons-material/UnfoldLess'
import UnfoldMore from '@mui/icons-material/UnfoldMore'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import DraggableDialog from '../components/DraggableDialog'
import {
  catalogTreeKeepMounted,
  nextCatalogHasOpened,
} from './catalogDialogState.js'
import {
  applyCatalogFilterChange,
  buildCatalogTableFilters,
} from './catalogTreeFilters.js'
import { tematicRazdelColumns } from './tematicRazdelColumns.jsx'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

/**
 * Каталог тематических разделов (Delphi TfrmStructNar, read-only) в модалке
 * карточки наряда. Дерево монтируется при первом открытии и остаётся
 * смонтированным, пока открыта карточка — чтобы помнить раскрытие и фильтры.
 */
export default function CatalogDialog({ open, onClose }) {
  const [hasOpened, setHasOpened] = useState(false)
  const [, setSelectedId] = useState(null)
  const [filters, setFilters] = useState([])
  const [expandToken, setExpandToken] = useState(null)
  const [filterEpoch, setFilterEpoch] = useState(0)
  const filtersRef = useRef(filters)
  const expandTokenRef = useRef(expandToken)
  filtersRef.current = filters
  expandTokenRef.current = expandToken

  useEffect(() => {
    setHasOpened((prev) => nextCatalogHasOpened(prev, open))
  }, [open])

  const tableFilters = useMemo(
    () => buildCatalogTableFilters(filters, expandToken),
    [filters, expandToken, filterEpoch],
  )

  const handleSetFilters = (updater) => {
    const result = applyCatalogFilterChange({
      prevFilters: filtersRef.current,
      expandToken: expandTokenRef.current,
      updater,
    })
    setExpandToken(result.expandToken)
    setFilters(result.filters)
  }

  return (
    <DraggableDialog
      open={open}
      onClose={onClose}
      keepMounted={catalogTreeKeepMounted(hasOpened)}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>Каталог</DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<UnfoldMore />}
            sx={buttonOutlinedSx}
            onClick={() => setExpandToken((token) => (token ?? 0) + 1)}
          >
            Раскрыть все
          </Button>
          <Button
            variant="outlined"
            startIcon={<UnfoldLess />}
            sx={buttonOutlinedSx}
            onClick={() => setFilterEpoch((epoch) => epoch + 1)}
          >
            Свернуть все
          </Button>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          {hasOpened ? (
            <AxiosProvider baseapi="/api">
              <BaseTreeTable
                url="/tematic-razdels"
                columns={tematicRazdelColumns}
                filters={tableFilters}
                setFilters={handleSetFilters}
                setSelectedId={setSelectedId}
                initialState={{ pagination: { pageIndex: 0, pageSize: 10000 } }}
              />
            </AxiosProvider>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Закрыть
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
