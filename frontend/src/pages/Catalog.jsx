import Box from '@mui/material/Box'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import { thematicCatalogColumns } from './thematicCatalogColumns.jsx'

/** Read-only каталог получает всё разрешённое пользователю дерево одним запросом. */
export default function Catalog() {
  return (
    <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
      <AxiosProvider baseapi="/api">
        <BaseTreeTable
          url="/catalog/tree"
          columns={thematicCatalogColumns}
          mode="eager"
          treeColumnId="name"
        />
      </AxiosProvider>
    </Box>
  )
}
