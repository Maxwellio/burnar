# Naryad Tree Status Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shared tree-table status footer with a fixed application-level status row that displays the selected naryad tree node ID.

**Architecture:** `BaseTreeTable` remains responsible for selection and reports the selected ID through its existing `setSelectedId` callback. `NaryadWorkspacePanel` owns that ID and renders the status row outside the tree's scroll container, so parameters, algorithm data, and status text share one source of truth.

**Tech Stack:** React 18, MUI 5, JavaScript modules, Node test runner, Vite 5, TypeScript/TSX staging copy of `mainComponent`

## Global Constraints

- Do not change tree selection, parameter loading, algorithm loading, cell wrapping, or grouped headers.
- Show the status row only on the naryad assignment and execution trees.
- Keep the status strip visible before selection, with no text.
- Add no dependencies.

---

### Task 1: Remove the shared BaseTreeTable status implementation

**Files:**
- Modify: `mainComponent-changes/BaseTable/BaseTreeTable.tsx`
- Modify: `mainComponent-changes/README.md`

**Interfaces:**
- Consumes: Existing `BaseTreeTable` props and `setSelectedId(row.original.id)` callback.
- Produces: `BaseTreeTable` without the `statusBar` prop, internal status state, helper registry, or `<tfoot>`.

- [ ] **Step 1: Remove the status API and helper code**

Delete `TreeStatusBar`, `TreeStatusBarContext`, `TREE_STATUS_BAR_FIELDS`,
`isTreeStatusBarVisible`, and `getTreeStatusBarParts`. Remove `statusBar` from
`BaseTreeTableProps` and from the component's destructured props.

- [ ] **Step 2: Remove duplicated state and footer markup**

Delete `selectedRowId`, its click/reset updates, `showStatusBar`,
`statusBarText`, and the status `<tfoot>`. Keep the external
`setSelectedId(row.original.id)` callback unchanged.

- [ ] **Step 3: Update transfer documentation**

Remove the old `statusBar` API instructions. State that the staged
`BaseTreeTable.tsx` contains only current wrapping and grouped-header changes,
and that the naryad-specific status row is rendered by
`NaryadWorkspacePanel`.

- [ ] **Step 4: Verify the old implementation is absent**

Run:

```bash
rg "TreeStatusBar|TREE_STATUS_BAR_FIELDS|statusBar|selectedRowId|<tfoot>" \
  mainComponent-changes/BaseTable/BaseTreeTable.tsx \
  mainComponent-changes/README.md
```

Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add mainComponent-changes/BaseTable/BaseTreeTable.tsx mainComponent-changes/README.md
git commit -m "refactor: remove tree table status footer"
```

### Task 2: Add the naryad-owned status row using TDD

**Files:**
- Modify: `frontend/src/pages/naryadWorkspaceData.test.js`
- Modify: `frontend/src/pages/naryadWorkspaceData.js`
- Modify: `frontend/src/pages/NaryadWorkspacePanel.jsx`
- Modify: `docs/naryady-notes.md`

**Interfaces:**
- Consumes: `selectedId: unknown` maintained by `NaryadWorkspacePanel`.
- Produces: `selectedNodeStatusText(selectedId): string`, returning `''` for
  `null`, `undefined`, or `''`, and `Код: ${String(selectedId)}` otherwise.

- [ ] **Step 1: Write the failing formatter test**

Extend the import and test file with:

```js
import {
  nodeIdFilters,
  selectedNodeStatusText,
} from './naryadWorkspaceData.js'

describe('selectedNodeStatusText', () => {
  it('is blank without a selected row', () => {
    assert.equal(selectedNodeStatusText(null), '')
    assert.equal(selectedNodeStatusText(undefined), '')
    assert.equal(selectedNodeStatusText(''), '')
  })

  it('formats numeric and string IDs', () => {
    assert.equal(selectedNodeStatusText(42), 'Код: 42')
    assert.equal(selectedNodeStatusText('99'), 'Код: 99')
  })
})
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
node --test frontend/src/pages/naryadWorkspaceData.test.js
```

Expected: FAIL because `selectedNodeStatusText` is not exported.

- [ ] **Step 3: Implement the formatter**

Add to `naryadWorkspaceData.js`:

```js
export function selectedNodeStatusText(selectedId) {
  if (selectedId == null || selectedId === '') {
    return ''
  }
  return `Код: ${String(selectedId)}`
}
```

- [ ] **Step 4: Run the focused test and confirm success**

Run:

```bash
node --test frontend/src/pages/naryadWorkspaceData.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Render a fixed status strip below the tree**

Import `selectedNodeStatusText`, compute:

```js
const treeStatusText = selectedNodeStatusText(selectedId)
```

Remove `statusBar={{ selectedId: true }}` from `BaseTreeTable`. Change the
left panel into a column with a flexing table area and add this sibling below
it:

```jsx
<Box
  role="status"
  aria-live="polite"
  sx={{
    height: 32,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    px: 1.5,
    boxSizing: 'border-box',
    borderTop: 1,
    borderColor: 'divider',
    bgcolor: '#F1F3F5',
    color: '#364FC7',
    fontSize: '0.875rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  }}
>
  {treeStatusText}
</Box>
```

- [ ] **Step 6: Update naryad documentation**

Document that each naryad workspace renders its own fixed status row from the
same `selectedId` used for parameters and algorithm loading.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/naryadWorkspaceData.test.js \
  frontend/src/pages/naryadWorkspaceData.js \
  frontend/src/pages/NaryadWorkspacePanel.jsx \
  docs/naryady-notes.md
git commit -m "feat: rebuild naryad tree status row"
```

### Task 3: Verify integration

**Files:**
- Verify: `frontend/src/pages/NaryadWorkspacePanel.jsx`
- Verify: `mainComponent-changes/BaseTable/BaseTreeTable.tsx`

**Interfaces:**
- Consumes: Completed Tasks 1 and 2.
- Produces: Passing tests and production build evidence.

- [ ] **Step 1: Run all frontend unit tests**

Run:

```bash
node --test frontend/src/**/*.test.js
```

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

from `frontend/`.

Expected: Vite exits successfully.

- [ ] **Step 3: Check the final diff**

Run:

```bash
git diff main...HEAD
git status --short
```

Expected: only planned files changed and no uncommitted implementation files.
