import Backdrop from '@mui/material/Backdrop'
import { useTheme } from '@mui/material/styles'
import SkvParamsDialog from './SkvParamsDialog.jsx'

/** Окна ниже modal, чтобы подтверждения, меню списков и календарь были поверх них. */
const WINDOWS_BELOW_MODAL = 20

/**
 * Общая подложка и окна сквозных параметров. Подложка закрывает карточку,
 * окна над ней немодальные: с обоими можно работать одновременно,
 * нажатие поднимает окно наверх.
 *
 * @param {object} props
 * @param {Record<string, object>} props.parts описания частей по id
 * @param {(partId: string) => string|null} props.otherPartId чьё окно можно открыть рядом
 */
export default function SkvParamsWindows({ naryadId, skvWindows, parts, otherPartId, onSaved }) {
  const theme = useTheme()
  const base = theme.zIndex.modal - WINDOWS_BELOW_MODAL
  const { windows, open, close, activate, paperRef } = skvWindows

  return (
    <>
      <Backdrop open={windows.length > 0} sx={{ zIndex: base - 1 }} />
      {windows.map((item, index) => {
        const part = parts[item.partId]
        const otherId = otherPartId(item.partId)
        return (
          <SkvParamsDialog
            key={item.partId}
            naryadId={naryadId}
            part={part}
            otherPart={otherId ? parts[otherId] : null}
            initialPosition={item.position}
            zIndex={base + index}
            paperRef={paperRef(item.partId)}
            onActivate={() => activate(item.partId)}
            onOpenOther={() => open(otherId, item.partId)}
            onClose={() => close(item.partId)}
            onSaved={onSaved}
          />
        )
      })}
    </>
  )
}
