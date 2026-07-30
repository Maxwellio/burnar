// API полного ACL-дерева тематических разделов (один GET, вложенные children).
import { requestJson } from './http.js'

/** @returns {Promise<Array<{ id: number, name: string, operKey?: number, hasChildren?: boolean, children?: unknown[] }>>} */
export function fetchThematicCatalog() {
  return requestJson('/thematic-catalog')
}
