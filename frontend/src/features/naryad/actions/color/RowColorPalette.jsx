import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import {
  NARYAD_COLOR_SWATCHES,
  NARYAD_DEFAULT_PICKER_COLOR,
  NARYAD_RECENT_ROW_COLOR_LIMIT,
  cssColorToDelphi,
} from './naryadRowColors.js'

const swatchSx = {
  width: 28,
  height: 28,
  borderRadius: 0.5,
  border: 1,
  borderColor: 'divider',
}

function SwatchButton({ css, label, onPick }) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      onClick={() => onPick(cssColorToDelphi(css))}
      sx={{ ...swatchSx, p: 0, bgcolor: css, cursor: 'pointer' }}
    />
  )
}

/**
 * Палитра: готовые образцы, до пяти недавних «своих» цветов и поле «Свой цвет».
 * Поле — видимый input type="color" на всю строку. Его нельзя прятать или открывать
 * скриптом: иначе Chrome прячет курсор внутри системного селектора.
 */
export default function RowColorPalette({ colors }) {
  const pick = (color) => {
    colors.closeMenu()
    void colors.applyColor(color)
  }

  return (
    <Popover
      open={Boolean(colors.menuAnchor)}
      anchorEl={colors.menuAnchor}
      onClose={colors.closeMenu}
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
    >
      <Box
        aria-label="Образцы цвета"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 28px)',
          gap: 0.75,
          p: 1,
        }}
      >
        {NARYAD_COLOR_SWATCHES.map((swatch) => (
          <SwatchButton key={swatch.css} css={swatch.css} label={swatch.label} onPick={pick} />
        ))}
        {Array.from({ length: NARYAD_RECENT_ROW_COLOR_LIMIT }, (_, index) => {
          const css = colors.recentColors[index]
          if (!css) {
            return <Box key={`empty-recent-${index}`} aria-hidden sx={swatchSx} />
          }
          return (
            <SwatchButton key={css} css={css} label={`Недавний цвет ${css}`} onPick={pick} />
          )
        })}
      </Box>
      <Box
        sx={{
          position: 'relative',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          component="span"
          sx={{
            display: 'block',
            pl: '52px',
            pr: 1.5,
            py: 1,
            pointerEvents: 'none',
            color: 'text.primary',
            fontSize: '0.875rem',
            lineHeight: '28px',
          }}
        >
          Свой цвет
        </Box>
        {/* Поле накрывает всю строку, поэтому клик по надписи тоже открывает
            селектор. Это по-прежнему прямой клик по видимому input, не скрипт. */}
        <Box
          ref={colors.bindColorInput}
          component="input"
          type="color"
          defaultValue={NARYAD_DEFAULT_PICKER_COLOR}
          aria-label="Свой цвет"
          onClick={(event) => {
            // Чёрный перед диалогом, чтобы повторный жёлтый тоже был изменением.
            event.currentTarget.value = '#000000'
          }}
          onInput={(event) => {
            colors.previewCustomColor(event.currentTarget.value)
          }}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            m: 0,
            p: 0,
            border: 0,
            opacity: 1,
            cursor: 'pointer',
            bgcolor: 'transparent',
            appearance: 'none',
            '&:hover': { bgcolor: 'action.hover' },
            '&::-webkit-color-swatch-wrapper': {
              position: 'relative',
              p: 0,
              width: '100%',
              height: '100%',
            },
            '&::-webkit-color-swatch': {
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 28,
              height: 28,
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 0.5,
            },
          }}
        />
      </Box>
    </Popover>
  )
}
