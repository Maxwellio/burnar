# Ответственные лица — шпаргалка для CRUD (след. итерация)

Документ для агента/разработчика: как реализовать кнопки на странице «Ответственные лица» и что уйдёт в админ-панель. Источники: Delphi `formUsersDoljn.pas` / `.dfm`, DDL в `C:\WORK\bd_bur-main`.

Текущий этап (уже сделан): только чтение списка людей и карьер + визуальные кнопки без handlers.

---

## 1. Модель БД

```text
people (id, fio, tabn, fioreports, codr3, fiorodpad)
  ├─ users (users_id, ora_name, people_id, active, note, dtenter, dtout, password)
  └─ karjera (key, idpeople, dtenter, dtout, doljinstru)
         └─ doljtostruct (key, doljnost, org, boss)
                ├─ sprdoljnost (key, nm)     — должность
                └─ org_stru (id, parent, nm) — подразделение («отдел»)
```

| Таблица | Роль |
|--------|------|
| `burnar.people` | Физлицо / ответственное лицо (ФИО) |
| `burnar.users` | Учётка ПО (логин `ora_name`) — **админ-панель** |
| `burnar.karjera` | Период работы в должности (даты) |
| `burnar.doljtostruct` | Пара «должность + орг»; создаётся внутри `karjera_add` при отсутствии |
| `burnar.sprdoljnost` | Справочник должностей |
| `burnar.org_stru` | Дерево структуры (`parent`) |

Sequences (из процедур): `burnar.seq_people`, `burnar.seq_users`, `burnar.seq_doljtostruct`.  
`karjera.key` при INSERT = `null` — заполняет триггер `ftrg_karjera_ins_before` (тело в дампе может отсутствовать).

---

## 2. Кнопки UI → куда мапить

### Страница «Ответственные лица» (эта страница)

| Кнопка UI | Действие Delphi | Реализация |
|-----------|-----------------|------------|
| Слева «Добавить» | `ToolButton4` → `people_add` | `CALL burnar.people_add(...)` — создаёт people + стартовую карьеру |
| Слева «Редактировать» | `ToolButton10` | Прямой `UPDATE burnar.people SET fio, tabn, fioreports WHERE id = ?` (org/должность в форме отключены) |
| Справа «Добавить» | `ToolButton3` → `karjera_add` | `akarjera_id = null`, `stat = 2` (в процедуре `stat` фактически не используется — ветка по `akarjera_id IS NULL`) |
| Справа «Редактировать» | `ToolButton13` → `karjera_add` | `akarjera_id = key` строки, `stat = 1` |
| Справа «Удалить» | `ToolButton12` | `DELETE FROM burnar.karjera WHERE key = ?` |

### Админ-панель (позже, не на этой странице)

| Действие | Процедура |
|----------|-----------|
| Создать/править учётку (логин, active, note, dtenter/dtout доступа) | `burnar.add_user` |
| Удалить человека целиком (users + karjera + people) | `burnar.deleteUser(people_id)` |
| Сменить пароль (админ) | `burnar.change_password_strict(ora_name, new_pwd)` |

---

## 3. Процедуры — контракты

### `burnar.people_add`

Файл: `bd_bur-main/procedures/people_add.txt`.

| Параметр | Тип | Смысл |
|----------|-----|--------|
| `afio` | varchar | ФИО |
| `acodr3` | numeric | код R3 (можно null) |
| `atabn` | numeric | табельный номер |
| `afioreports` | varchar | ФИО для отчётов |
| `afiorodpad` | varchar | род. падеж (в Delphi часто null) |
| `datein` | date | дата начала карьеры |
| `aorg_id` | integer | `org_stru.id` |
| `adolj_id` | integer | `sprdoljnost.key` |
| `apeople_id` | INOUT integer | возвращает новый `people.id` |

Побочный эффект: внутри вызывает `karjera_add(apeople_id, null, dateIn, '01.01.2040', aorg_id, adolj_id, null)` — **dtout по умолчанию 01.01.2040**.

**Веб:** модалка с полями fio, tabn, fioreports, dateIn, org, должность → `JdbcTemplate` / `SimpleJdbcCall` на процедуру → рефреш левой таблицы (`reRenderSignal`) и выбор нового `id`.

### `burnar.karjera_add`

Файл: `bd_bur-main/procedures/karjera_add.txt`.

| Параметр | Тип | Смысл |
|----------|-----|--------|
| `apeople` | integer | `people.id` |
| `akarjera_id` | integer | `null` = insert, иначе update по `karjera.key` |
| `datein` / `dateout` | date | период |
| `aorg_id` | integer | орг |
| `adolj_id` | integer | должность |
| `stat` | numeric | в Delphi 1=правка, 2=добавление; **в теле процедуры не читается** — используйте `akarjera_id` |

Логика: найти/создать `doljtostruct` по `(doljnost, org)`, затем insert/update `karjera`.

**Веб:** модалка dateIn/Out + org + должность; для edit передать `key` выбранной строки карьеры (`CareerDto.id`). После успеха — рефреш правой таблицы.

### `burnar.add_user` (админ-панель)

| Параметр | Смысл |
|----------|--------|
| `p_people` | people.id |
| `p_role_id` | в коде закомментирован — передавать null |
| `p_dtenter` / `p_dtout` | даты доступа к системе (не карьера!) |
| `p_act` | active 0/1 |
| `p_note` | примечание |
| `p_username` | логин (UPPER при insert); **нельзя сменить**, если учётка уже есть |
| `p_password` | только при create; хеш через `burnar.get_hash` |

### `burnar.deleteUser(peopleid)`

Каскад: `users` → `znpodpis` → `karjera` → `people`. `doljtostruct` **не** чистит.

### `burnar.change_password_strict(p_username, p_new_password)`

Админская смена без старого пароля.

---

## 4. Прямой SQL из Delphi (не процедуры)

**Редактирование ФИО (левая кнопка «Редактировать»):**

```sql
UPDATE burnar.people
SET fio = :fio, tabn = :tabn, fioreports = :fioreports
WHERE id = :id
```

**Удаление карьеры:**

```sql
DELETE FROM burnar.karjera WHERE key = :key
```

---

## 5. Справочники для диалогов

| Справочник | SQL / источник |
|------------|----------------|
| Должности | `SELECT key, nm FROM burnar.sprdoljnost ORDER BY nm` (Delphi `qrDoljSpr`) |
| Орг. дерево (комбо) | Recursive CTE по `org_stru.parent`; админ — корни как в Delphi `(1,5,6,7,8,91,123)` или `org-filter-ids` из `application.properties`; обычный пользователь — поддерево от `PodrId` (= `resolveUserOrgId`) |
| Список СП фильтра (уже есть) | `GET /api/org-units` → `OrgAccessService.listFilterOrgUnits` |

Путь орг. для отображения (колонка «Отдел») — тот же CTE, что `OWNER_PATH_SQL` в `NaryadListService` / `ResponsiblePersonService`.

---

## 6. Уже реализованные read-API (не ломать контракт)

| Метод | Назначение |
|-------|------------|
| `GET /api/responsible-persons?page&size&orgUnitId` | Левая таблица: `id`, `fio`, `oraName`. ACL: parent-поддерево |
| `GET /api/responsible-persons/{peopleId}/careers?page&size` | Правая: `id`(=key), `dtEnter`, `dtOut`, `doljNm`, `orgNm` |

Фронт: `BaseTable.setSelectedId` читает **`row.original.id`** — у людей `id` = `people.id`, у карьер `id` = `karjera.key`.

Фильтр орг.: не-админ — `resolveUserOrgId` + parent CTE; админ «Все» — без cut; админ с Select — parent-поддерево выбранного id. Хелпер: `OrgAccessService.appendOrgParentSubtreeFilter`.

---

## 7. Предлагаемые write-эндпоинты (следующий этап)

Страница ответственных:

- `POST /api/responsible-persons` → `people_add`
- `PUT /api/responsible-persons/{id}` → UPDATE people
- `POST /api/responsible-persons/{id}/careers` → `karjera_add` (insert)
- `PUT /api/responsible-persons/{id}/careers/{karjeraKey}` → `karjera_add` (update)
- `DELETE /api/responsible-persons/{id}/careers/{karjeraKey}` → DELETE karjera

Админ-панель (отдельно):

- `POST/PUT /api/admin/users` → `add_user`
- `DELETE /api/admin/people/{id}` → `deleteUser`
- `POST /api/admin/users/{oraName}/password` → `change_password_strict`

После мутаций: инкремент `reRenderSignal` у соответствующей `BaseTable`; для people — сохранить/восстановить `selectedId`.

---

## 8. Поля модалок (минимум)

**Добавить человека:** fio (обяз.), tabn, fioreports, dateIn, org_id, dolj_id.  
**Редактировать человека:** fio, tabn, fioreports (без смены стартовой орг/должности — как Delphi).  
**Добавить/править карьеру:** dateIn, dateOut, org_id, dolj_id; при правке — key.

Валидация: dateOut ≥ dateIn; org/должность обязательны при add/edit карьеры.

---

## 9. Что не переносить на первом CRUD-проходе

- Чекбоксы «Должностные лица» / «Пользователи ПО» (`ora_name IS NULL` / `IS NOT NULL`).
- Excel (`qrPrintUser` / `qrStruct`).
- Справочник должностей как отдельная форма (`frmSprdolj_list`).
- Скрытые кнопки «Сохранить все / Отменить» пакетного редактирования карьер (`ToolButton1/2`).
