import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { AxiosProvider, BaseTable, BaseTreeTable } from 'mainComponent'
import { ACTION_BAR_HEIGHT } from './naryadPageLayout.js'
import { naryadZadanieParamColumns } from './naryadZadanieParamColumns.jsx'

const ALG_FIELD_HEIGHT = 120

/**
 * Общая раскладка вкладок задания и выполнения:
 * пустой action bar, дерево 75%, справа параметры + read-only поле алгоритма.
 * Таблицы монтируются сразу; бэка ещё нет — 404 даёт пустое тело при видимых шапках.
 */
export default function NaryadWorkspacePanel({
  actionBarAriaLabel,
  treeUrl,
  treeColumns,
  paramsUrl,
}) {
  const [treeFilters, setTreeFilters] = useState([])
  const [paramFilters, setParamFilters] = useState([])

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-label={actionBarAriaLabel}
        sx={{
          height: ACTION_BAR_HEIGHT,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <AxiosProvider baseapi="/api">
          <Box
            sx={{
              flex: '3 1 0',
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRight: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
              <BaseTreeTable
                url={treeUrl}
                columns={treeColumns}
                filters={treeFilters}
                setFilters={setTreeFilters}
                initialState={{ pagination: { pageIndex: 0, pageSize: 10000 } }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              flex: '1 1 0',
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
              <BaseTable
                url={paramsUrl}
                columns={naryadZadanieParamColumns}
                filters={paramFilters}
                setFilters={setParamFilters}
              />
            </Box>
            <Box
              sx={{
                height: ALG_FIELD_HEIGHT,
                flexShrink: 0,
                px: 1,
                py: 0.75,
                boxSizing: 'border-box',
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <TextField
                value=""
                multiline
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                inputProps={{ 'aria-label': 'Алгоритм', 'aria-readonly': true }}
                sx={{
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    overflow: 'auto',
                  },
                  '& textarea': {
                    overflow: 'auto !important',
                  },
                }}
              />
            </Box>
          </Box>
        </AxiosProvider>
      </Box>
    </Box>
  )
}
