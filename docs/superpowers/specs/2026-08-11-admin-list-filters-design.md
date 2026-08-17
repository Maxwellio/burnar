# Admin list filters — design

Approved approach: BaseTable `filters` → query params → SQL (как `orgUnitId` на ответственных).

## UI

- Убрать кнопку «Сменить пароль» с левого тулбара `Admin.jsx`.
- Добавить две пары чекбоксов: «Ответственные лица» / «Пользователи», «Активные» / «Неактивные».
- По умолчанию все выключены → без фильтра (весь список).
- Внутри пары взаимоисключение; повторный клик снимает выбор.
- Пары между собой и с колоночным поиском — AND.

## Семантика

| Фильтр | SQL |
|--------|-----|
| Ответственные лица | `u.users_id IS NULL` |
| Пользователи | `u.users_id IS NOT NULL` |
| Активные | `u.active = 1` |
| Неактивные | `u.active = 0` |

Query params: `accountKind=responsible|users`, `activeKind=active|inactive`.

«Ответственные лица» и «Активные/Неактивные» взаимно сбрасывают друг друга в UI
(без учётки нет `active`; пересечение иначе было бы пустым).

## Frontend

- State: `accountKind`, `activeKind` (`null` или значение).
- Инжект в `usersFilters` + safe `setFilters`, чтобы колоночный поиск не затирал чекбоксы.

## Backend

- `AdminUserController` / `AdminUserService.findUsers` принимают и применяют params.
- Колоночные фильтры `id`/`fio`/`oraName`/`note` без изменений.
