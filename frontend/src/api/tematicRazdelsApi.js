import { requestJson } from './http.js'

/** Один узел каталога: { id, name, oper, ... }. */
export function fetchTematicRazdel(id) {
  return requestJson(`/tematic-razdels/${id}`)
}
