# Тематические разделы — шпаргалка

Источники: Delphi `formStructNur.pas` / `formStructNur.dfm`, открытие MDI — `MainUnit.tbtnStructNarsClick` и `qrShowTemRazdel` в `MainUnit.dfm`. DDL: `C:\WORK\bd_bur-main\tematic_razdel.txt`, `spr_oper.txt`, `org_stru_tem_cat`.

Пакет таблицы: `mainComponent` (`BaseTreeTable`). Исходники пакета не меняем. В burnar только путь зависимости `file:../../table_comp/src/mainComponent` и тот же `fs.allow` в Vite — без обходов резолва.

## Статус реализации

| Часть | Статус |
|-------|--------|
| Дерево: код раздела / наименование / код операции | **сделано** (read-only) |
| Ленивые дети `GET .../{id}/children` | **сделано** |
| ACL: не-админ — `org_stru_tem_cat` + sysboss, обрезано до поддерева id=2; админ — корень id=2 | **сделано** |
| Выбор строки (`selectedId`) | **сделано** (кнопок нет) |
| Поиск по колонкам (id/oper префикс, name подстрока, AND) | **сделано** |
| Тулбар: заглушки «Раскрыть все» / «Свернуть все» | **сделано** (без действия) |
| Тулбар: поиск, автоширина, рабочий expand/collapse | отложено |
| Дата операции | отложено |
| Вставка в задание / выполнение (`*_Add_Razdel`, `*_Add_Emp_Razdel`) | отложено |
| Модальный `GetHierarchyItem` | отложено |
| Хаб прочих справочников | отложено |

Маршрут: `/catalog`. Меню: «Тематические разделы» (`ROLE_USER` + `ROLE_ADMIN`).

---

## 1. Модель БД

```text
public.tematic_razdel (id, nm, parent_id, ord, oper, nartype, colorsel)
  ├─ parent_id → tematic_razdel.id  (дерево, ON DELETE CASCADE)
  └─ oper → public.spr_oper.key     (NULL = раздел, иначе операция)

burnar.org_stru_tem_cat (org_id, tem_cat_id)
  └─ разрешённые КОРНИ каталога для орг. единицы
```

Имя в гриде: `oper IS NULL → t.nm`, иначе `spr_oper.nm`.

Delphi LoadTree скрывает `parent_id`, `ord`, `nartype`. В JSON они есть для кнопок позже.

---

## 2. API

`BaseTreeTable` ждёт **массив**, не Spring `Page`. Без фильтров поле `children` с сервера **не отдаём**. При поиске корни приходят уже с вложенными `children`.

| Метод | Назначение |
|-------|------------|
| `GET /api/tematic-razdels` | Корни: `{ id, name, oper, parentId, ord, nartype, hasChildren }`. Query: `id`, `name`, `oper` (AND). |
| `GET /api/tematic-razdels/{id}/children` | Дети того же shape; чужой id у USER → `[]` |

Порядок: `ord NULLS FIRST, id`.

**Поиск** (все непустые параметры сразу):

- `id` — префикс `CAST(id AS text)` (в коде `startsWith`): `67` не находит `167`.
- `oper` — префикс кода операции; у раздела без операции совпадения нет.
- `name` — подстрока без регистра по отображаемому имени (`t.nm` или `spr_oper.nm`).
- Совпадения возвращаются **вложенным лесом** с предками до видимого корня.

**ACL**

- Не-админ: корни = `tem_cat_id` из `org_stru_tem_cat`, где `org_id` в sysboss-поддереве орг. текущей карьеры (`karjera` + `doljtostruct` + `users`, `dtenter/dtout` vs now). Затем обрезка до поддерева `id = 2`: предок/сам 2 → один корень 2; потомки 2 сохраняются; узлы вне поддерева отбрасываются. Нет карьеры / нет строк каталога / после обрезки пусто → пустой список.
- Админ: без `org_stru_tem_cat`. Корень `id = 2`; если нет — `parent_id IS NULL`.
- Дети: все `parent_id = :id` без повторного фильтра каталога. USER: `:id` должен быть в лесу от обрезанных корней, иначе `[]`. Админ: `:id` только в поддереве 2, иначе `[]`.

---

## 3. Frontend

- [frontend/src/pages/Catalog.jsx](../frontend/src/pages/Catalog.jsx) — тулбар-заглушки + фильтры колонок + `BaseTreeTable url="/tematic-razdels"`
- [frontend/src/pages/tematicRazdelColumns.jsx](../frontend/src/pages/tematicRazdelColumns.jsx) — три колонки с поиском в шапке; expander в «Наименование»
- [frontend/src/config/menuItems.jsx](../frontend/src/config/menuItems.jsx) — пункт «Тематические разделы»

Контракт `BaseTreeTable` (пакет не править):

- `GET {url}` → корни; раскрытие → `GET {url}/{id}/children`
- узел: `id`, `hasChildren`; клиент сам ставит `children` / `hasLoaded`
- `setIsLeaf` в пакете не вызывается; leaf: `oper != null` и/или `!hasChildren`

---

## 4. Кнопки UI (Delphi → веб, не делать сейчас)

| Delphi | Назначение |
|--------|------------|
| Поиск + Locate | ToolButton1 — в вебе три поля в шапке колонок, не Locate |
| Collapse/expand | ToolButton2 — в UI заглушки «Раскрыть все» / «Свернуть все», без действия |
| Автоширина | ToolButton3 |
| «Задание» N1/N2/N5 | `Zadanie_Add_Razdel` / `Zadanie_Add_Emp_Razdel` |
| «Выполнение» N3/N4/N6 | `vipolnenie_Add_Razdel` / `Vipolnenie_Add_Emp_Razdel` |
| Дата операции | `DateTimePicker1` → параметр `datein` |
| Drag-and-drop на дерево наряда | `CatalogMouseDown` → CommonNarZad/Vip |

`razdel` в процедурах = выбранный `id` (код раздела).

---

## 5. Файлы backend

| Файл | Роль |
|------|------|
| `TematicRazdelNodeDto` | узел дерева |
| `TematicRazdelService` | JDBC + ACL; корень id=2 и обрезка ACL |
| `TematicRazdelController` | `/api/tematic-razdels` |

`SecurityConfig` не менялся: `/api/**` authenticated.
