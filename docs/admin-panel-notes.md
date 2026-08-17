# Админ-панель — шпаргалка

Источники: Delphi `formUsersDoljn.pas` / `formPeopleAdd.pas` / `UnitChangePass.pas`, DDL в `C:\WORK\bd_bur-main`, лейаут-референс — substitute `Work_redone/frontend/src/features/admin`.

Связанная страница: [`responsible-persons-crud-notes.md`](responsible-persons-crud-notes.md) (people + карьеры без учёток).

## Статус реализации

| Часть | Статус |
|-------|--------|
| Лейаут: таблица пользователей + правая панель (форма + карьеры) | **сделано** |
| Read-API списка и карточки (`/api/admin/users`) | **сделано** |
| Карьеры (read) через `/api/responsible-persons/{id}/careers` | **сделано** |
| CRUD карьер (reuse API/диалог ответственных лиц) | **сделано** |
| Колонка «Роль» (`spr_role`) | отложено |
| Левый тулбар учёток / сохранение формы / пароль | не сделано |
| Фильтры списка: ответственные/пользователи, активные/неактивные | **сделано** |
| Excel | отложено |

---

## 1. Модель (учётка)

```text
people (id, fio, …)
  └─ users (users_id, ora_name, people_id, active, note, dtenter, dtout, password)
```

`role_id` / `spr_role` в текущей DDL нет (в Delphi join закомментирован). Колонку роли в UI не показываем, пока не появится модель.

---

## 2. API

| Метод | Назначение |
|-------|------------|
| `GET /api/admin/users` | Pageable-список: `id`, `fio`, `oraName`, `usersId`, `active`, `dtEnter`, `dtOut`, `note` |
| `GET /api/admin/users/{peopleId}` | Карточка для правой формы (те же поля + без пароля) |
| `GET /api/responsible-persons/{id}/careers` | Карьеры выбранного (reuse) |
| `POST/PUT/DELETE .../careers[/{key}]` | Write карьер (тот же API, что на «Ответственных лицах») |

Доступ: `ROLE_ADMIN` (`SecurityConfig` → `/api/admin/**`).

ACL списка: `OrgAccessService.appendOrgParentSubtreeFilter` (как у ответственных лиц).  
Фильтры BaseTable (query): `id`, `fio`, `oraName`, опционально `note`.

Чекбоксы тулбара (query, AND с колоночным поиском; по умолчанию выкл = без фильтра):

| UI | Query | SQL |
|----|-------|-----|
| Ответственные лица | `accountKind=responsible` | `u.users_id IS NULL` |
| Пользователи | `accountKind=users` | `u.users_id IS NOT NULL` |
| Активные | `activeKind=active` | `u.active = 1` |
| Неактивные | `activeKind=inactive` | `u.active = 0` |

Внутри каждой пары — взаимоисключение (повторный клик снимает фильтр).  
«Ответственные лица» и «Активные/Неактивные» взаимно сбрасывают друг друга в UI (без учётки нет `active`).

Статус в таблице: из `active` — «Подключен» / «Отключен» (как Delphi `account_status`).

---

## 3. Кнопки UI → будущая реализация

### Левый тулбар (люди / учётки)

| Кнопка (план UI) | Будущий API / процедура | Примечание |
|------------------|-------------------------|------------|
| Добавить | `people_add` и/или `add_user` | Delphi: ToolButton4 / formPeopleAdd |
| Редактировать ФИО | `PUT /responsible-persons/{id}` или отдельный | ToolButton10 |
| Сохранить учётку (форма справа) | `CALL burnar.add_user(...)` | ToolButton8; сейчас `p_role_id => null` |
| Удалить | `CALL burnar.deleteUser(id)` | Уже есть на странице ответственных |
| Сменить пароль (кнопка убрана с тулбара) | `CALL burnar.change_password_strict(...)` | UnitChangePass; UI позже |
| Должности (справочник) | отдельный экран / modal | ToolButton14, `frmSprdolj_list` |
| Excel | выгрузка | `btnPrintToExcel`, шаблон Users.xls |

### Правый тулбар (карьеры) — **сделано**

| Кнопка | API (reuse «Ответственные лица») | БД |
|--------|----------------------------------|-----|
| Добавить | `POST .../careers` | `karjera_add` (`stat = 2`) |
| Редактировать | `PUT .../careers/{key}` | `karjera_add` (`stat = 1`) |
| Удалить | `DELETE .../careers/{key}` | `DELETE FROM karjera` |

В `Admin.jsx`: `CareerFormDialog` + `useConfirm`; при удалении последней карьеры — предупреждение и refresh левой таблицы (`usersRenderSignal`), т.к. `/admin/users` JOIN'ит `karjera`.

---

## 4. UI

- Страница: `frontend/src/pages/Admin.jsx` (`/admin`, `AdminOnly`).
- Колонки: `adminUserColumns.jsx` — код, ФИО, логин, статус, даты, заметка (**без роли**).
- Форма: `AdminUserFormPanel.jsx` — ФИО, логин, пароль (пусто), даты, примечание, «Активен»; данные с `GET /api/admin/users/{id}`.
- Правая панель всегда открыта, шире (~7 : 3.5), верх — форма, низ — BaseTable карьер.
- Таблицы: `BaseTable` из `mainComponent`.

---

## 5. Отложенное / отличия от substitute

- Колонка и справочник ролей (`spr_role`) — когда появится колонка в `users` или иное решение.
- Чекбоксы списка (accountKind / activeKind) сделаны; org/role checkboxes из substitute не обязательны.
- Телефон / «Первое подключение» из substitute в burnar нет.
- Страница «Ответственные лица» не меняется; админка — учётная оболочка над теми же people/карьерами.
