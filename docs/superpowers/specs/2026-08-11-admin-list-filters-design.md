# Admin list filters — design

Approved approach: BaseTable `filters` → query params → SQL (как `orgUnitId` на ответственных).

## UI

- Убрать кнопку «Сменить пароль» с левого тулбара `Admin.jsx`.
- Добавить две пары чекбоксов: «Ответственные лица» / «Пользователи», «Активные» / «Неактивные».
- По умолчанию все выключены → без фильтра (весь список).
- Внутри пары взаимоисключение; повторный клик снимает выбор.
- Пары между собой, с Select «структура» и с колоночным поиском — AND.
- Select «структура» справа в тулбаре (`ml: auto`), как на «Ответственных лицах»:
  справочник `GET /responsible-persons/org-units`, пункт «Все» по умолчанию.
  Фильтрует только левую таблицу; карьеры справа без `orgUnitId`.
  Смена значения сбрасывает выбранного человека и карьеру, режим «Добавить» не трогает.

## Семантика

| Фильтр | SQL |
|--------|-----|
| Ответственные лица | `u.users_id IS NULL` |
| Пользователи | `u.users_id IS NOT NULL` |
| Активные | `u.active = 1` |
| Неактивные | `u.active = 0` |

Query params: `accountKind=responsible|users`, `activeKind=active|inactive`,
опционально `orgUnitId` (parent-поддерево, как у ответственных лиц).

«Ответственные лица» и «Активные/Неактивные» взаимно сбрасывают друг друга в UI
(без учётки нет `active`; пересечение иначе было бы пустым).

## Frontend

- State: `accountKind`, `activeKind` (`null` или значение), `orgUnitId` (`'all'` или id).
- Инжект в `usersFilters` + safe `setFilters`, чтобы колоночный поиск не затирал чекбоксы и структуру.

## Backend

- `AdminUserController` / `AdminUserService.findUsers` принимают и применяют params
  (`orgUnitId` → `appendOrgParentSubtreeFilter`).
- Колоночные фильтры `id`/`fio`/`oraName`/`note` без изменений.
