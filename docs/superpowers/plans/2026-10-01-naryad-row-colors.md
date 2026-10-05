# Naryad Row Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent Delphi-compatible row colors and separate color/reset buttons to the assignment and completion action bars.

**Architecture:** Existing `colorsel` values remain the source of truth. Spring endpoints update one row after ACL, ownership, value-range, and closed-state checks; React converts Delphi BGR values to CSS RGB, applies successful changes locally, and asks the shared tree table to clear selection without reloading its lazy tree.

**Tech Stack:** Java 17, Spring Boot 2.7, JDBC, JUnit 5/Mockito, React 18, MUI 5, TanStack Table 8, Node test runner.

## Global Constraints

- Assignment and completion have separate controls on their own action bars.
- Only one selected row is supported in this iteration.
- Reset affects only that selected row.
- Store Delphi `TColor` BGR integers; `0` means no color and cannot represent black.
- Existing and lazily loaded colored rows must render correctly.
- Do not add dependencies or reload/collapse the tree after mutation.
- Preserve default `BaseTreeTable` behavior when new optional props are absent.
- Record `Ctrl/Cmd` and `Shift` multi-selection as future work only.

---

### Task 1: Color conversion contract

**Files:**
- Create: `frontend/src/pages/naryadRowColors.test.js`
- Create: `frontend/src/pages/naryadRowColors.js`

**Interfaces:**
- Produces: `delphiColorToCss(value): string | undefined`
- Produces: `cssColorToDelphi(value): number`
- Produces: `NARYAD_DEFAULT_PICKER_COLOR = '#ffff00'`

- [ ] **Step 1: Write failing conversion tests**

Test no-color values, Delphi red (`255 → #ff0000`), Delphi blue
(`16711680 → #0000ff`), a mixed color round trip, invalid CSS, and black
(`'#000000' → 0`).

- [ ] **Step 2: Verify the tests fail**

Run:

```bash
cd frontend && node --test src/pages/naryadRowColors.test.js
```

Expected: FAIL because `naryadRowColors.js` does not exist.

- [ ] **Step 3: Implement the conversion**

Use the Delphi channel layout:

```js
const r = color & 0xff
const g = (color >> 8) & 0xff
const b = (color >> 16) & 0xff
const delphi = (b << 16) | (g << 8) | r
```

Return `undefined` for `null`, non-integers, `0`, and values above
`0xffffff`; reject malformed CSS with `TypeError`.

- [ ] **Step 4: Verify green**

Run the Task 1 command and expect all tests to pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/naryadRowColors.js frontend/src/pages/naryadRowColors.test.js
git commit -m "feat: add Delphi color conversion"
```

### Task 2: Closed-state and row-color backend API

**Files:**
- Create: `backend/src/main/java/burnar/dto/NaryadRowColorRequest.java`
- Create: `backend/src/main/java/burnar/dto/NaryadRowColorDto.java`
- Modify: `backend/src/main/java/burnar/dto/NaryadHeaderDto.java`
- Modify: `backend/src/main/java/burnar/service/NaryadListService.java`
- Modify: `backend/src/main/java/burnar/service/NaryadWorkspaceService.java`
- Modify: `backend/src/main/java/burnar/controller/NaryadWorkspaceController.java`
- Modify: `backend/src/test/java/burnar/service/NaryadWorkspaceServiceTest.java`

**Interfaces:**
- Consumes: `PATCH .../{nodeId}/color`, JSON `{ "color": 0..16777215 }`
- Produces: JSON `{ "nodeId": number, "color": number }`
- Produces: header booleans `zadanieClosed`, `vipolnenieClosed`
- Produces: `updateZadanieColor(int, long, Integer)` and
  `updateVipolnenieColor(int, long, Integer)`

- [ ] **Step 1: Write failing backend tests**

Add tests asserting:

```java
assertEquals(0, NaryadWorkspaceService.requireValidColor(0));
assertEquals(0xFFFFFF, NaryadWorkspaceService.requireValidColor(0xFFFFFF));
assertThrows(ResponseStatusException.class,
        () -> NaryadWorkspaceService.requireValidColor(-1));
assertThrows(ResponseStatusException.class,
        () -> NaryadWorkspaceService.requireValidColor(0x1000000));
assertThrows(ResponseStatusException.class,
        () -> NaryadWorkspaceService.requireValidColor(null));
```

Also assert that assignment and completion update SQL constrain both
`narkey` and `key` and target their respective `colorsel` columns.

- [ ] **Step 2: Verify red**

Run:

```bash
cd backend && mvn -Dtest=NaryadWorkspaceServiceTest test
```

Expected: compilation failure because the validation method and SQL constants
do not exist.

- [ ] **Step 3: Add DTOs and header fields**

The request has `Integer color`; the response has `Long nodeId` and
`Integer color`. Extend the header query with:

```sql
(SELECT z.closed = 1 FROM burnar.defnarzad z WHERE z.narkey = d.key) AS zadanie_closed,
(SELECT v.closed = 1 FROM burnar.defnarvip v WHERE v.narkey = d.key) AS vipolnenie_closed
```

Map nullable results to nullable `Boolean` properties.

- [ ] **Step 4: Implement guarded updates**

For each part:

1. call `naryadListService.findHeader(naryadId)` for ACL;
2. validate `color` as an integer in `0..0xffffff`;
3. query the matching `defnarzad` or `defnarvip` descriptor;
4. return `404` if the descriptor or row does not exist;
5. return `409` if `closed = 1`;
6. run a parameterized update constrained by `narkey` and `key`.

Annotate each public mutation with `@Transactional`. Never interpolate table
names or values supplied by the client.

- [ ] **Step 5: Add controller methods**

Add:

```java
@PatchMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/color")
@PatchMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/color")
```

Pass `request == null ? null : request.getColor()` to the service.

- [ ] **Step 6: Verify green**

Run the Task 2 Maven command and expect `BUILD SUCCESS`.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/burnar backend/src/test/java/burnar/service/NaryadWorkspaceServiceTest.java
git commit -m "feat: add naryad row color API"
```

### Task 3: Optional tree row background and selection reset

**Files:**
- Modify: `mainComponent-changes/BaseTable/BaseTreeTable.tsx`
- Modify: `mainComponent-changes/README.md`

**Interfaces:**
- Produces optional `getRowBackgroundColor?: (row: TData) => string | undefined`
- Produces optional `clearSelectionSignal?: number`

- [ ] **Step 1: Document expected component behavior before implementation**

Extend the staging README with the two optional props, explicitly stating that
selection blue overrides the persisted background and signal changes call
`table.resetRowSelection()`.

- [ ] **Step 2: Add props and reset effect**

Add both props to `BaseTreeTableProps`, destructure them, and run:

```tsx
useEffect(() => {
  table.resetRowSelection()
}, [clearSelectionSignal])
```

- [ ] **Step 3: Apply unselected row background**

On each body `<tr>`, add:

```tsx
style={{
  backgroundColor: row.getIsSelected()
    ? undefined
    : getRowBackgroundColor?.(row.original),
}}
```

Keep all existing classes and click behavior.

- [ ] **Step 4: Statically verify the staged API**

Run:

```bash
rg "getRowBackgroundColor|clearSelectionSignal|resetRowSelection|backgroundColor" \
  mainComponent-changes/BaseTable/BaseTreeTable.tsx mainComponent-changes/README.md
```

Expected: matches for both props, the reset, and row styling.

- [ ] **Step 5: Commit**

```bash
git add mainComponent-changes/BaseTable/BaseTreeTable.tsx mainComponent-changes/README.md
git commit -m "feat: support persistent tree row backgrounds"
```

### Task 4: Separate assignment and completion controls

**Files:**
- Modify: `frontend/src/api/naryadyApi.js`
- Modify: `frontend/src/pages/NaryadPage.jsx`
- Modify: `frontend/src/pages/NaryadZadaniePanel.jsx`
- Modify: `frontend/src/pages/NaryadVipolneniePanel.jsx`
- Modify: `frontend/src/pages/NaryadWorkspacePanel.jsx`
- Modify: `frontend/src/pages/naryadRowColors.test.js`
- Modify: `frontend/src/pages/naryadRowColors.js`
- Modify: `docs/naryady-notes.md`

**Interfaces:**
- Produces: `updateNaryadRowColor(id, part, nodeId, color)`
- Consumes: `part` equal to `'zadanie'` or `'vipolnenie'`
- Consumes: each part's nullable `closed` flag

- [ ] **Step 1: Write failing frontend behavior tests**

Add pure helper tests showing that:

- DB colors are used when no local override exists;
- local `0` suppresses an old DB color;
- local nonzero color overrides the DB value;
- buttons are disabled with no selected row or `closed === true`.

- [ ] **Step 2: Verify red**

Run:

```bash
cd frontend && node --test src/pages/naryadRowColors.test.js
```

Expected: FAIL because the override and availability helpers do not exist.

- [ ] **Step 3: Implement helpers and API client**

Implement:

```js
rowBackgroundColor(row, overrides)
canChangeRowColor(selectedId, closed)
updateNaryadRowColor(id, part, nodeId, color)
```

The request uses `PATCH`, JSON content type, and `requestJson`.

- [ ] **Step 4: Pass closed state to each panel**

Store `zadanieClosed` and `vipolnenieClosed` from `fetchNaryadHeader`, then pass:

```jsx
<NaryadZadaniePanel closed={zadanieClosed} />
<NaryadVipolneniePanel closed={vipolnenieClosed} />
```

Each wrapper passes its own `part` and `closed` values to
`NaryadWorkspacePanel`.

- [ ] **Step 5: Render each panel's own controls**

In the existing per-panel action bar render two `IconButton`s with tooltips
«Выделить строку цветом» and «Сбросить цвет». Use a visually hidden
`<input type="color">` for the first action. On success:

1. save the returned color in a local `Map` keyed by selected node ID;
2. set `selectedId` to `null`;
3. increment `clearSelectionSignal`;
4. leave lazy tree data and expansion untouched.

On failure call `useAlert()` and do not change the map or selection.

- [ ] **Step 6: Connect row background rendering**

Pass to `BaseTreeTable`:

```jsx
getRowBackgroundColor={(row) => rowBackgroundColor(row, colorOverrides)}
clearSelectionSignal={clearSelectionSignal}
```

This renders API-provided `colorsel` on initial and child fetches and gives
local successful writes immediate precedence.

- [ ] **Step 7: Update documentation**

Document separate controls, selected-row-only reset, BGR compatibility,
closed-state behavior, and future `Ctrl/Cmd` plus `Shift` selection.

- [ ] **Step 8: Verify frontend tests**

Run the Task 4 Node command and expect all tests to pass.

- [ ] **Step 9: Commit**

```bash
git add frontend/src docs/naryady-notes.md
git commit -m "feat: add naryad row color controls"
```

### Task 5: Full verification

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes all prior task outputs.
- Produces a tested implementation ready for review.

- [ ] **Step 1: Run backend suite**

```bash
cd backend && mvn test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 2: Run frontend unit tests**

```bash
cd frontend && node --test src/**/*.test.js
```

Expected: all tests pass.

- [ ] **Step 3: Build frontend**

```bash
cd frontend && npm run build
```

Expected: Vite exits `0`.

- [ ] **Step 4: Inspect final diff**

```bash
git diff origin/main...HEAD --check
git status --short
```

Expected: no whitespace errors and no uncommitted files.
