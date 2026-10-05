import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  NARYAD_COLOR_SWATCHES,
  NARYAD_DEFAULT_PICKER_COLOR,
  NARYAD_RECENT_ROW_COLORS_KEY,
  NARYAD_RECENT_ROW_COLOR_LIMIT,
  canChangeRowColor,
  colorOverrideBaseline,
  cssColorToDelphi,
  delphiColorToCss,
  parseRecentRowColors,
  readRecentRowColors,
  rememberRecentRowColor,
  rowBackgroundColor,
  withRowColorOverride,
  withoutUnsavedColorOverride,
  writeRecentRowColors,
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

describe('row color preview', () => {
  it('shows an intermediate override before the server answers', () => {
    const overrides = withRowColorOverride(new Map([[7, 255]]), 7, 16711680)
    assert.equal(rowBackgroundColor({ id: 7, colorsel: 255 }, overrides), '#0000ff')
  })

  it('restores the previous override when a custom color is not saved', () => {
    const original = new Map([[7, 255]])
    const baseline = colorOverrideBaseline(original, 7)
    const preview = withRowColorOverride(original, 7, 16711680)
    assert.equal(
      withoutUnsavedColorOverride(preview, baseline).get(7),
      255,
    )
  })

  it('drops an unsaved override when the row had no local color', () => {
    const baseline = colorOverrideBaseline(new Map(), 7)
    const preview = withRowColorOverride(new Map(), 7, 255)
    assert.equal(withoutUnsavedColorOverride(preview, baseline).has(7), false)
  })
})

describe('recent row colors', () => {
  it('keeps the five newest custom colors with the latest first', () => {
    let colors = []
    for (const css of ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff8000', '#7030a0']) {
      colors = rememberRecentRowColor(colors, css)
    }
    assert.deepEqual(colors, ['#7030a0', '#ff8000', '#ffff00', '#0000ff', '#00ff00'])
    assert.equal(colors.length, NARYAD_RECENT_ROW_COLOR_LIMIT)
  })

  it('moves a repeated color to the front without a duplicate', () => {
    const colors = rememberRecentRowColor(['#00ff00', '#ff0000'], '#FF0000')
    assert.deepEqual(colors, ['#ff0000', '#00ff00'])
  })

  it('does not store black or malformed colors', () => {
    const colors = ['#ff0000']
    assert.deepEqual(rememberRecentRowColor(colors, '#000000'), colors)
    assert.deepEqual(rememberRecentRowColor(colors, 'red'), colors)
    assert.deepEqual(rememberRecentRowColor(colors, '#12345'), colors)
  })

  it('parses only valid stored colors', () => {
    assert.deepEqual(parseRecentRowColors('not-json'), [])
    assert.deepEqual(parseRecentRowColors('{"color":"#ff0000"}'), [])
    assert.deepEqual(
      parseRecentRowColors('["#FF0000","#000000","nope","#00ff00","#ff0000","#123456","#abcdef","#010101"]'),
      ['#ff0000', '#00ff00', '#123456', '#abcdef', '#010101'],
    )
  })

  it('round-trips the list through storage and ignores storage failures', () => {
    const storage = new Map()
    const api = {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, value),
    }
    writeRecentRowColors(['#00ff00', '#000000', '#ff0000'], api)
    assert.equal(storage.get(NARYAD_RECENT_ROW_COLORS_KEY), '["#00ff00","#ff0000"]')
    assert.deepEqual(readRecentRowColors(api), ['#00ff00', '#ff0000'])
    assert.deepEqual(readRecentRowColors({ getItem: () => { throw new Error('denied') } }), [])
    assert.doesNotThrow(() => writeRecentRowColors(['#ff0000'], {
      setItem: () => { throw new Error('denied') },
    }))
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
