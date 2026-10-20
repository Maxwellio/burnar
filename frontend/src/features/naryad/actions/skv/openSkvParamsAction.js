import ListAlt from '@mui/icons-material/ListAlt'

/**
 * actOpenSkvZad / actOpenSkvVip (Ctrl+Y): окно сквозных параметров своей части.
 * В Delphi не участвует в ActionList1Update — доступно всегда, в том числе у закрытой части.
 */
export const openSkvParamsAction = {
  id: 'open-skv-params',
  getLabel: (ctx) => ctx.part.skv.openLabel,
  icon: ListAlt,
  isEnabled: (ctx) => typeof ctx.openSkv === 'function',
  run(ctx) {
    ctx.openSkv()
  },
}
