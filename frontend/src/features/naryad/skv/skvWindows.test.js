import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { activateSkvWindow, closeSkvWindow, openSkvWindow, skvOpenerId } from './skvWindows.js'

const zad = { partId: 'zadanie', position: { x: 0, y: 0 } }
const vip = { partId: 'vipolnenie', position: { x: 400, y: 0 } }

describe('skv windows', () => {
  it('opens a new window on top and only raises an open one', () => {
    const opened = openSkvWindow([zad], 'vipolnenie', vip.position)
    assert.deepEqual(opened, [zad, vip])
    assert.deepEqual(openSkvWindow(opened, 'zadanie', { x: 9, y: 9 }), [vip, zad])
  })

  it('raises a window without touching the order when it is already on top', () => {
    const windows = [zad, vip]
    assert.equal(activateSkvWindow(windows, 'vipolnenie'), windows)
    assert.deepEqual(activateSkvWindow(windows, 'zadanie'), [vip, zad])
    assert.equal(activateSkvWindow(windows, 'missing'), windows)
  })

  it('closes one window', () => {
    assert.deepEqual(closeSkvWindow([zad, vip], 'zadanie'), [vip])
    const windows = [zad]
    assert.equal(closeSkvWindow(windows, 'vipolnenie'), windows)
  })

  it('places a new window beside the requested or any open window', () => {
    assert.equal(skvOpenerId([zad], 'vipolnenie', 'zadanie'), 'zadanie')
    assert.equal(skvOpenerId([zad], 'vipolnenie', null), 'zadanie')
    assert.equal(skvOpenerId([], 'vipolnenie', 'zadanie'), null)
    assert.equal(skvOpenerId([vip], 'vipolnenie', null), null)
  })
})
