# Ответственные лица — шпаргалка CRUD

Источники: Delphi `formUsersDoljn.pas` / `formPeopleAdd.pas`, DDL в `C:\WORK\bd_bur-main`.

## Статус реализации

| Часть | Статус |
|-------|--------|
| Список людей + карьеры (read) | сделано |
| Add / Edit people (модалка + API) | **сделано** |
| Delete people (admin, `deleteUser`) | **сделано** |
| CRUD карьер справа | не сделано |
| Учётки / пароль (админ-панель) | не сделано |

---

## 1. Модель БД

```text
people (id, fio, tabn, fioreports, codr3, fiorodpad)
  ├─ users (users_id, ora_name, people_id, active, note, dtenter, dtout, password)
  └─ karjera (key, idpeople, dtenter, dtout, doljinstru)
         └─ doljtostruct (key, doljnost, org, boss)
                ├─ sprdoljnost (key, nm)
                └─ org_stru (id, parent, nm)
```

Sequences: `burnar.seq_people`, `burnar.seq_users`, `burnar.seq_doljtostruct`.  
`karjera.key` при INSERT = `null` — триггер `ftrg_karjera_ins_before`.

---

## 2. Кнопки UI → реализация

### Слева (people) — сделано

| Кнопка | API | БД |
|--------|-----|-----|
| Добавить | `POST /api/responsible-persons` | `CALL burnar.people_add` (`acodr3 = null`) |
| Редактировать | `PUT /api/responsible-persons/{id}` | `UPDATE people SET fio, tabn, fioreports, fiorodpad` |
| Удалить (только admin) | `DELETE /api/responsible-persons/{id}` | `CALL burnar.deleteUser` + `useConfirm` |

Форма: `PeopleFormDialog` в `DraggableDialog`.  
Поля: ФИО, инициалы (`fioreports`), род.п. (`fiorodpad`), таб.№, дата начала, должность, подразделение. **Без `codr3`.**  
Edit: дата / должность / подразделение **скрыты**.

**Отличие от Delphi:** `fiorodpad` сохраняем и на add, и на edit (в Delphi add всегда `null`, edit не обновлял поле).

### Справа (карьеры) — ещё не сделано

| Кнопка | Действие Delphi | Целевая реализация |
|--------|-----------------|-------------------|
| Добавить | `karjera_add` (`akarjera_id = null`) | `POST .../careers` |
| Редактировать | `karjera_add` (`akarjera_id = key`) | `PUT .../careers/{key}` |
| Удалить | `DELETE FROM karjera` | `DELETE .../careers/{key}` |

### Админ-панель (позже)

| Действие | Процедура |
|----------|-----------|
| Учётка | `burnar.add_user` |
| Пароль | `burnar.change_password_strict` |

Удаление человека уже на странице ответственных (admin), не только в админ-панели.

---

## 3. Реализованные API

| Метод | Назначение |
|-------|------------|
| `GET /api/responsible-persons?page&size&orgUnitId&id&fio&oraName` | Список (BaseTable) |
| `GET /api/responsible-persons/org-units` | Select «структура» (id 1,5,6,7,8,123) |
| `GET /api/responsible-persons/positions` | `sprdoljnost` |
| `GET /api/responsible-persons/org-tree` | Пути орг. для комбо add (админ: корни 1,5,6,7,8,91,123; иначе от `resolveUserOrgId`) |
| `GET /api/responsible-persons/{id}` | Карточка edit: fio, fioreports, fiorodpad, tabn |
| `POST /api/responsible-persons` | `people_add` → `{ id }` |
| `PUT /api/responsible-persons/{id}` | UPDATE people (+ fiorodpad) |
| `DELETE /api/responsible-persons/{id}` | `deleteUser`, только admin |
| `GET /api/responsible-persons/{id}/careers` | Карьеры |

ACL: `OrgAccessService.appendOrgParentSubtreeFilter` (parent).  
Фронт: `BaseTable.setSelectedId` → `row.original.id` (= `people.id` / `karjera.key`).

---

## 4. Процедуры (справочно)

### `burnar.people_add`

Параметры: `afio, acodr3, atabn, afioreports, afiorodpad, datein, aorg_id, adolj_id, apeople_id (INOUT)`.  
Внутри: `karjera_add(..., dateOut='01.01.2040', ...)`.

### `burnar.karjera_add`

Ветка по `akarjera_id IS NULL` (insert) / иначе update. `stat` в теле не читается.

### `burnar.deleteUser(peopleid)`

Каскад: `users` → `znpodpis` → `karjera` → `people`.

---

## 5. UI-инфра (из substitute)

| Файл | Роль |
|------|------|
| `frontend/src/components/DraggableDialog.jsx` | Перетаскиваемые формы |
| `frontend/src/hooks/useDraggableDialog.js` | Drag-логика |
| `frontend/src/components/ConfirmDialog.jsx` | Confirm UI |
| `frontend/src/context/ConfirmContext.jsx` | `ConfirmProvider` / `useConfirm()` |

`ConfirmProvider` в `App.jsx` внутри `AuthProvider`. Дальнейшие подтверждения — только через `useConfirm`.

---

## 6. Следующий этап (карьеры)

- `POST/PUT/DELETE` careers → `karjera_add` / `DELETE karjera`
- Модалка: dateIn/Out, org, должность
- Confirm на удаление карьеры через `useConfirm`
- `reRenderSignal` правой таблицы
