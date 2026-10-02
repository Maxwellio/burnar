import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  NARYAD_COLOR_SWATCHES,
  NARYAD_DEFAULT_PICKER_COLOR,
  canChangeRowColor,
  cssColorToDelphi,
  delphiColorToCss,
  rowBackgroundColor,
} from './naryadRowColors.js'

describe('delphiColorToCss', () => {
  it('returns no color for invalid Delphi values', () => {
    assert.equal(delphiColorToCss(null), undefined)
    assert.equal(delphiColorToCss(undefined), undefined)
    assert.equal(delphiColorToCss(0), undefined)
    assert.equal(delphiColorToCss(1.5), undefined)
    assert.equal(delphiColorToCss(0x1000000), undefined)
  })

  it('converts Delphi BGR colors to CSS RGB colors', () => {
    assert.equal(delphiColorToCss(255), '#ff0000')
    assert.equal(delphiColorToCss(16711680), '#0000ff')
  })
})

describe('cssColorToDelphi', () => {
  it('round trips a mixed color', () => {
    const cssColor = '#123456'
    assert.equal(cssColorToDelphi(cssColor), 5649426)
    assert.equal(delphiColorToCss(cssColorToDelphi(cssColor)), cssColor)
  })

  it('converts black to zero', () => {
    assert.equal(cssColorToDelphi('#000000'), 0)
  })

  it('rejects malformed CSS colors', () => {
    assert.throws(() => cssColorToDelphi('red'), TypeError)
    assert.throws(() => cssColorToDelphi('#12345g'), TypeError)
  })
})

describe('NARYAD_DEFAULT_PICKER_COLOR', () => {
  it('is yellow', () => {
    assert.equal(NARYAD_DEFAULT_PICKER_COLOR, '#ffff00')
  })
})

describe('rowBackgroundColor', () => {
  it('uses the DB color when no local override exists', () => {
    assert.equal(
      rowBackgroundColor({ id: 7, colorsel: 255 }, new Map()),
      '#ff0000',
    )
  })

  it('uses a local zero override to suppress an old DB color', () => {
    assert.equal(
      rowBackgroundColor({ id: 7, colorsel: 255 }, new Map([[7, 0]])),
      undefined,
    )
  })

  it('uses a local nonzero override instead of the DB color', () => {
    assert.equal(
      rowBackgroundColor({ id: 7, colorsel: 255 }, new Map([[7, 16711680]])),
      '#0000ff',
    )
  })
})

describe('NARYAD_COLOR_SWATCHES', () => {
  it('stores every sample as a visible Delphi color', () => {
    assert.ok(NARYAD_COLOR_SWATCHES.length >= 8)
    const labels = new Set()
    for (const swatch of NARYAD_COLOR_SWATCHES) {
      assert.equal(labels.has(swatch.label), false)
      labels.add(swatch.label)
      const delphi = cssColorToDelphi(swatch.css)
      assert.ok(delphi > 0)
      assert.equal(delphiColorToCss(delphi), swatch.css)
    }
  })

  it('includes the default yellow sample', () => {
    assert.ok(NARYAD_COLOR_SWATCHES.some((swatch) => swatch.css === NARYAD_DEFAULT_PICKER_COLOR))
  })
})

describe('canChangeRowColor', () => {
  it('disables color actions when no row is selected', () => {
    assert.equal(canChangeRowColor(null, false), false)
  })

  it('disables color actions when the panel is closed', () => {
    assert.equal(canChangeRowColor(7, true), false)
  })

  it('disables color actions while a mutation is pending', () => {
    assert.equal(canChangeRowColor(7, false, true), false)
  })

  it('enables color actions for a selected row unless closed or pending', () => {
    assert.equal(canChangeRowColor(7, false), true)
    assert.equal(canChangeRowColor(7, null), true)
    assert.equal(canChangeRowColor(7, false, false), true)
  })
})
