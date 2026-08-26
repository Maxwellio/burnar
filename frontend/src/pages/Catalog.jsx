import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import { tematicRazdelColumns } from './tematicRazdelColumns.jsx'

/**
 * Каталог тематических разделов (Delphi TfrmStructNar, read-only).
 * Дерево: GET /api/tematic-razdels и /{id}/children через BaseTreeTable.
 * selectedId держим для будущих кнопок вставки в наряд; тулбара пока нет.
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
      }}
    >
      <Typography variant="h6" sx={{ flexShrink: 0, mb: 2 }}>
        Тематические разделы
      </Typography>
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
