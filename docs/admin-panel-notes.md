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
| Сохранение формы / пароль (bcrypt → `add_user`) | **сделано** |
| Удаление из левого тулбара | **сделано** |
| Фильтры списка: ответственные/пользователи, активные/неактивные | **сделано** |
| Сортировка левой таблицы по статусу и датам + сброс поиска/сортировки | **сделано** |
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
| `POST /api/admin/users` | Создать: `people_add`, при логине — `add_user` (пароль уже bcrypt) |
| `PUT /api/admin/users/{peopleId}` | ФИО + при логине `add_user`; пустой пароль на существующей учётке не меняет hash |
| `GET /api/responsible-persons/{id}/careers` | Карьеры выбранного (reuse) |
| `POST/PUT/DELETE .../careers[/{key}]` | Write карьер (тот же API, что на «Ответственных лицах») |

Доступ: `ROLE_ADMIN` (`SecurityConfig` → `/api/admin/**`).

ACL списка: `OrgAccessService.appendOrgParentSubtreeFilter` (как у ответственных лиц).  
Фильтры BaseTable (query): `id`, `fio`, `oraName`, опционально `note`.

Сортировка хедеров левой таблицы (query, одна колонка; без параметра — `ORDER BY fio, id`):

| UI | Query | SQL |
|----|-------|-----|
| Статус | `sortBy=active`, `sortDir=asc\|desc` | текст «Отключен»/«Подключен», затем ФИО; пустой статус всегда в конце |
| Дата подкл. | `sortBy=dtEnter` | `dtenter` NULLS LAST, затем ФИО |
| Дата откл. | `sortBy=dtOut` | `dtout` NULLS LAST, затем ФИО |

Клик по хедеру: первый — по возрастанию, повтор — по убыванию; другая колонка — сразу ASC. Снять сортировку — только «Сбросить фильтры».

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

Пароль: фронт шлёт plaintext (или пусто); `AdminUserService` делает bcrypt и передаёт хеш в `add_user`. Процедура должна **не** вызывать `get_hash`: INSERT пишет `p_password` как есть; UPDATE меняет `password` только если `p_password` не пустой.

---

## 3. Кнопки UI

### Левый тулбар (люди / учётки)

| Кнопка | API / процедура | Примечание |
|--------|-----------------|------------|
| Добавить (слева) | открывает форму `mode=add` | Delphi: ToolButton4 |
| Добавить / Сохранить (форма справа) | `POST/PUT /api/admin/users` → `people_add` и/или `add_user` | bcrypt на сервисе; `p_role_id = null`. Без логина — только ответственное лицо, «Активен» выкл. |
| Удалить | `DELETE /api/responsible-persons/{id}` → `deleteUser` | confirm; каскад users/карьеры/people |
| Сменить пароль (кнопка убрана с тулбара) | поле пароля на форме + `add_user` | пустой пароль при UPDATE не меняет hash |
| Должности (справочник) | отдельный экран / modal | ToolButton14, `frmSprdolj_list` |
| Сбросить фильтры | очищает колоночный поиск и сортировку | после чекбоксов; disabled, пока поиск пуст и сортировки нет; чекбоксы не трогает |
| Excel | выгрузка | `btnPrintToExcel`, шаблон Users.xls |

### Правый тулбар (карьеры) — **сделано**

| Кнопка | API (reuse «Ответственные лица») | БД |
|--------|----------------------------------|-----|
| Добавить | `POST .../careers` | `karjera_add` (`stat = 2`) |
| Редактировать | `PUT .../careers/{key}` | `karjera_add` (`stat = 1`) |
| Удалить | `DELETE .../careers/{key}` | `DELETE FROM karjera` |

В `Admin.jsx`: `CareerFormDialog` + `useConfirm`; при удалении последней карьеры — предупреждение и refresh левой таблицы (`usersRenderSignal`), т.к. `/admin/users` JOIN'ит `karjera`.

`doljtostruct` — общий справочник пар должность×подразделение (`UNIQUE (doljnost, org)`), на одну строку могут ссылаться несколько карьер. Удаление/смена карьеры и `deleteUser` не должны трогать пару, пока на неё ещё есть `karjera`; сироты снимает триггер `trg_karjera_cleanup_doljtostruct` в `bd_bur` (скрипт наката: [`cleanup-orphan-doljtostruct.sql`](cleanup-orphan-doljtostruct.sql), затем `CALL burnar.cleanup_orphan_doljtostruct();`). Справочник должностей удаляет `sprdoljnost` только если нет ни одной карьеры (включая закрытые) и нет `spr_workers.boss`; перед этим чистит оставшиеся сироты этой должности.

---

## 4. UI

- Страница: `frontend/src/pages/Admin.jsx` (`/admin`, `AdminOnly`).
- Колонки: `adminUserColumns.jsx` — код, ФИО, логин, статус, даты, заметка (**без роли**). Хедеры статуса и дат кликабельны (стрелка направления).
- Форма: `AdminUserFormPanel.jsx` — ФИО, логин, пароль, даты, примечание, «Активен», кнопка «Добавить»/«Сохранить» под чекбоксом.
- Правая панель всегда открыта, шире (~7 : 3.5), верх — форма, низ — BaseTable карьер.
- Таблицы: `BaseTable` из `mainComponent`.

---

## 5. Отложенное / отличия от substitute

- Колонка и справочник ролей (`spr_role`) — когда появится колонка в `users` или иное решение.
- Чекбоксы списка (accountKind / activeKind) сделаны; org/role checkboxes из substitute не обязательны.
- Телефон / «Первое подключение» из substitute в burnar нет.
- Страница «Ответственные лица» не меняется; админка — учётная оболочка над теми же people/карьерами.
