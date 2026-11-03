import { useRef, useState } from 'react'
import MenuBook from '@mui/icons-material/MenuBook'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { fetchNaryadOcards } from '../../../../api/naryadyApi.js'
import DraggableDialog from '../../../../components/DraggableDialog.jsx'
import ActionButton from '../../workspace/ActionButton.jsx'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import {
  OPER_CARD_LABEL,
  OPER_CARD_MISSING,
  OPER_CARD_POPUP_BLOCKED,
  OPER_CARD_TITLE,
  canShowOperCard,
  operCardPlan,
} from './operCardRules.js'

/** Delphi actShowOk. Одна карта открывается сразу, несколько — списком ссылок. */
export default function ShowOperCardButton() {
  const ctx = useNaryadWorkspace()
  const [files, setFiles] = useState(null)
  const opening = useRef(false)
  const enabled = canShowOperCard(
    ctx.tree.selectedIds,
    ctx.closed,
    ctx.mutation.pending,
    ctx.workAction,
  )

  async function openCard() {
    if (opening.current) return
    const nodeId = detailNodeId(ctx.tree.getSelectedIds())
    if (nodeId == null || !canShowOperCard([nodeId], ctx.getClosed(), ctx.mutation.isPending(), ctx.workAction)) return
    opening.current = true
    try {
      const rows = await fetchNaryadOcards(ctx.naryadId, ctx.part.id, nodeId)
      const plan = operCardPlan(rows)
      if (plan.kind === 'missing') {
        await ctx.showAlert(OPER_CARD_MISSING)
        return
      }
      if (plan.kind === 'open') {
        const opened = window.open(plan.url, '_blank')
        if (opened) opened.opener = null
        else await ctx.showAlert(OPER_CARD_POPUP_BLOCKED)
        return
      }
      setFiles(plan.files)
    } catch (error) {
      await ctx.showAlert(error?.message || 'Операция не выполнена')
    } finally {
      opening.current = false
    }
  }

  return (
    <>
      <ActionButton
        label={OPER_CARD_LABEL}
        icon={MenuBook}
        disabled={!enabled}
        onClick={() => {
          void openCard()
        }}
      />
      <DraggableDialog open={files != null} onClose={() => setFiles(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{OPER_CARD_TITLE}</DialogTitle>
        <DialogContent dividers>
          <List dense disablePadding>
            {(files ?? []).map((file) => (
              <ListItem key={file.url} disableGutters>
                <Link href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </Link>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button type="button" variant="outlined" onClick={() => setFiles(null)}>
            Закрыть
          </Button>
        </DialogActions>
      </DraggableDialog>
    </>
  )
}
