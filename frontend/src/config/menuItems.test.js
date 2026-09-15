import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

function readRepo(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('catalog is not a standalone route', () => {
  it('is not a drawer menu item', () => {
    const src = readRepo('frontend/src/config/menuItems.jsx')
    assert.equal(src.includes("path: '/catalog'"), false)
  })

  it('is not a React Router page', () => {
    const src = readRepo('frontend/src/App.jsx')
    assert.equal(src.includes('path="/catalog"'), false)
    assert.equal(src.includes("from './pages/Catalog.jsx'"), false)
  })

  it('is not forwarded by Spring to the SPA', () => {
    const src = readRepo(
      'backend/src/main/java/burnar/controller/SpaForwardController.java',
    )
    assert.equal(src.includes('"/catalog"'), false)
    assert.equal(src.includes('"/catalog/**"'), false)
  })
})
