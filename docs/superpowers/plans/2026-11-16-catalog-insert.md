# Catalog Insert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Немодальный каталог с date-only и вставкой полного/пустого раздела в задание и выполнение (before/after/end).

**Architecture:** Backend `POST .../{part}/catalog` считает slot из якоря и вызывает `*_add_razdel` / `*_add_emp_razdel`. Frontend `CatalogDialog` в `modeless`, живые якоря с панелей наряда, правила в чистых функциях.

**Tech Stack:** Java 17, Spring Boot, JDBC, JUnit 5; React 18, MUI 5, `@mui/x-date-pickers` DesktopDatePicker, node:test.

**Spec:** `docs/superpowers/specs/2026-11-16-catalog-insert-design.md`

## Global Constraints

- Каталог `modeless`, без затемняющей подложки.
- Date-only `dd.MM.yyyy`; на сервер — timestamp начала суток.
- Place: `before` | `after` | `end` | `inside` (inside только после диалога пустого блока).
- `end` только если якорь — раздел; на операции пункт disabled.
- Пустой раздел: кнопка disabled если в каталоге выбрана операция.
- DDL не меняем.

## Files

- Backend: `NaryadCatalogInsertRequest`, slot helpers in `NaryadClipboard`, methods in `NaryadOperEditService`, endpoints in `NaryadWorkspaceController`, tests.
- Frontend: `catalogInsertRules.js` + tests, API helper, `CatalogDialog.jsx`, wire `NaryadPage` / `NaryadWorkspacePanel`, docs notes.

---

### Task 1: Backend slot + procedure call

**Files:**
- Modify: `backend/src/main/java/burnar/service/NaryadClipboard.java`
- Create: `backend/src/main/java/burnar/dto/NaryadCatalogInsertRequest.java`
- Modify: `backend/src/main/java/burnar/service/NaryadOperEditService.java`
- Modify: `backend/src/main/java/burnar/controller/NaryadWorkspaceController.java`
- Modify: `backend/src/test/java/burnar/service/NaryadClipboardTest.java`

- [ ] **Step 1:** Add `catalogSlot(Node anchor, String place, boolean treeEmpty)` — empty→`(null,1)`; `end`→`(anchor.id, null)` only if block; else reuse `pasteSlot` for before/after/inside; locked before/after → 409.
- [ ] **Step 2:** Request DTO: `razdelId`, `dateIn`, `place`, `mode`, `anchorNodeId`.
- [ ] **Step 3:** Service `insertFromCatalog` for zad/vip: closed check; empty mode checks `tematic_razdel.oper IS NULL`; resolve slot; CALL procedures with who=null, withname=1.
- [ ] **Step 4:** Endpoints `POST /{id}/zadanie/catalog` and `.../vipolnenie/catalog` → 204.
- [ ] **Step 5:** Unit tests for catalogSlot; commit.

### Task 2: Frontend rules + API

**Files:**
- Create: `frontend/src/pages/catalogInsertRules.js`, `catalogInsertRules.test.js`
- Modify: `frontend/src/api/naryadyApi.js`

- [ ] **Step 1:** Rules: `canInsertCatalog`, place menu enablement, empty-block before prompt need, date default/format.
- [ ] **Step 2:** `insertNaryadCatalog(id, part, payload)`.
- [ ] **Step 3:** Tests; commit.

### Task 3: CatalogDialog UI + page wiring

**Files:**
- Modify: `frontend/src/pages/CatalogDialog.jsx`
- Modify: `frontend/src/features/naryad/NaryadPage.jsx`
- Modify: `frontend/src/features/naryad/workspace/NaryadWorkspacePanel.jsx`
- Modify: `frontend/src/features/naryad/workspace/useNaryadWorkspaceState.js` (optional callback)
- Modify: `docs/tematic-razdel-notes.md`, `docs/naryady-notes.md`

- [ ] **Step 1:** `modeless` dialog; DesktopDatePicker date-only; 4 split buttons with place menus.
- [ ] **Step 2:** Panels report `{ detailId, structureById, rowCount }` to page; page passes anchors + closed/hasVip + onInserted.
- [ ] **Step 3:** On catalog open, keep workspace interactive; mount vip panel if hasVipolnenie so selection works.
- [ ] **Step 4:** Docs; commit; push; update PR.
