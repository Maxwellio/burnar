import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import UnfoldLess from '@mui/icons-material/UnfoldLess'
import UnfoldMore from '@mui/icons-material/UnfoldMore'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import { tematicRazdelColumns } from './tematicRazdelColumns.jsx'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

/**
 * Каталог тематических разделов (Delphi TfrmStructNar, read-only).
 * Дерево от id=2: GET /api/tematic-razdels и /{id}/children через BaseTreeTable.
 * selectedId держим для будущих кнопок вставки в наряд.
 * Тулбар: заглушки «Раскрыть все» / «Свернуть все» (как Add/Edit/Delete на нарядах).
 */
export default function Catalog() {
  const [selectedId, setSelectedId] = useState(null)

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 2.5,
        boxSizing: 'border-box',
        gap: 2,
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
        <Button variant="outlined" startIcon={<UnfoldMore />} sx={buttonOutlinedSx}>
          Раскрыть все
        </Button>
        <Button variant="outlined" startIcon={<UnfoldLess />} sx={buttonOutlinedSx}>
          Свернуть все
        </Button>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <AxiosProvider baseapi="/api">
          <BaseTreeTable
            url="/tematic-razdels"
            columns={tematicRazdelColumns}
            setSelectedId={setSelectedId}
          />
        </AxiosProvider>
      </Box>
    </Box>
  )
}
