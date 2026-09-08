import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { AxiosProvider, BaseTable, BaseTreeTable } from 'mainComponent'
import { ACTION_BAR_HEIGHT } from './naryadPageLayout.js'
import { naryadZadanieColumns } from './naryadZadanieColumns.jsx'
import { naryadZadanieParamColumns } from './naryadZadanieParamColumns.jsx'

const ALG_FIELD_HEIGHT = 120

/**
 * Вкладка «Задание»: пустой action bar, дерево работ 75% и справа параметры + алгоритм.
 * Таблицы монтируются сразу; бэка ещё нет — 404 даёт пустое тело при видимых шапках.
 */
export default function NaryadZadaniePanel({ naryadId }) {
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
        aria-label="Панель действий задания"
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
                url={`/naryady/${naryadId}/zadanie`}
                columns={naryadZadanieColumns}
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
                url={`/naryady/${naryadId}/zadanie/params`}
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
                label="Алгоритм"
                value=""
                multiline
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                inputProps={{ 'aria-readonly': true }}
                sx={{
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: 'calc(100% - 8px)',
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
