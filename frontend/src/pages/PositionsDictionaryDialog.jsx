import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { AxiosProvider, BaseTable } from 'mainComponent'
import { deletePosition } from '../api/adminPositionsApi.js'
import DraggableDialog from '../components/DraggableDialog'
import { useConfirm } from '../context/ConfirmContext.jsx'
import PositionFormDialog from './PositionFormDialog.jsx'
import { positionColumns } from './positionColumns.jsx'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

/**
 * Модальный справочник должностей (Delphi frmSprdolj_list).
 * Список — BaseTable GET /admin/positions; add/edit — PositionFormDialog; delete — useConfirm.
 * onChanged — после успешной записи, чтобы Select на форме add пользователя перечитал комбо.
 */
export default function PositionsDictionaryDialog({ open, onClose, onChanged }) {
  const confirm = useConfirm()
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState([])
  const [renderSignal, setRenderSignal] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('add')
  const [error, setError] = useState('')

  const hasRow = selectedId != null

  const bumpTable = () => {
    setRenderSignal((n) => n + 1)
    onChanged?.()
  }

  const handleAdd = () => {
    setError('')
    setFormMode('add')
    setFormOpen(true)
  }

  // BaseTable double-click передаёт id; кнопка — event, тогда берём selectedId.
  const handleEdit = (idArg) => {
    const id = typeof idArg === 'number' ? idArg : selectedId
    if (id == null) return
    setSelectedId(id)
    setError('')
    setFormMode('edit')
    setFormOpen(true)
  }

  const handleSaved = () => {
    bumpTable()
  }

  const handleDelete = async () => {
    if (!hasRow) return
    const ok = await confirm('Удалить выбранную должность?', { action: 'удаление' })
    if (!ok) return
    setError('')
    try {
      await deletePosition(selectedId)
      setSelectedId(null)
      bumpTable()
    } catch (e) {
      setError(e?.message || 'Не удалось удалить должность')
    }
  }

  const handleDialogClose = () => {
    setSelectedId(null)
    setFilters([])
    setError('')
    setFormOpen(false)
    onClose?.()
  }

  return (
    <>
      <DraggableDialog
        open={open}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '70vh' } }}
      >
        <DialogTitle>Справочник должностей</DialogTitle>
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
              variant="contained"
              startIcon={<AddIcon />}
              disableElevation
              onClick={handleAdd}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Добавить
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              disabled={!hasRow}
              onClick={handleEdit}
              sx={buttonOutlinedSx}
            >
              Редактировать
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              disabled={!hasRow}
              onClick={handleDelete}
              sx={buttonOutlinedSx}
            >
              Удалить
            </Button>
          </Box>
          {error ? (
            <Typography variant="body2" color="error" sx={{ flexShrink: 0 }}>
              {error}
            </Typography>
          ) : null}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {open ? (
              <AxiosProvider baseapi="/api">
                <BaseTable
                  url="/admin/positions"
                  columns={positionColumns}
                  filters={filters}
                  setFilters={setFilters}
                  setSelectedId={setSelectedId}
                  handleDoubleClick={handleEdit}
                  reRenderSignal={renderSignal}
                  pageable
                />
              </AxiosProvider>
            ) : null}
          </Box>
        </DialogContent>
      </DraggableDialog>

      <PositionFormDialog
        open={formOpen}
        mode={formMode}
        positionId={formMode === 'edit' ? selectedId : null}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </>
  )
}
