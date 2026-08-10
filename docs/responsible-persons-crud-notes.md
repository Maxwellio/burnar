# Ответственные лица — шпаргалка CRUD

Источники: Delphi `formUsersDoljn.pas` / `formPeopleAdd.pas` / `formNewEditCareer.pas`, DDL в `C:\WORK\bd_bur-main`.

## Статус реализации

| Часть | Статус |
|-------|--------|
| Список людей + карьеры (read) | сделано |
| Add / Edit people | **сделано** |
| Delete people (admin, `deleteUser`) | **сделано** |
| CRUD карьер справа | **сделано** |
| Учётки / пароль (админ-панель) | read layout — см. [admin-panel-notes.md](admin-panel-notes.md); write не сделано |

---

## 1. Модель БД

```text
people (id, fio, tabn, fioreports, codr3, fiorodpad)
  ├─ users (...)
  └─ karjera (key, idpeople, dtenter, dtout, doljinstru)
         └─ doljtostruct → sprdoljnost + org_stru
```

---

## 2. Кнопки UI → реализация

### Слева (people)

| Кнопка | API | БД |
|--------|-----|-----|
| Добавить | `POST /api/responsible-persons` | `people_add` (`acodr3 = null`) |
| Редактировать | `PUT /api/responsible-persons/{id}` | `UPDATE people` (+ `fiorodpad`) |
| Удалить (admin) | `DELETE /api/responsible-persons/{id}` | `deleteUser` + `useConfirm` |

**Отличие от Delphi:** `fiorodpad` сохраняем на add и edit. Без поля `codr3`.

### Справа (карьеры)

| Кнопка | API | БД |
|--------|-----|-----|
| Добавить | `POST .../{peopleId}/careers` | `karjera_add` (`akarjera_id = null`, `stat = 2`) |
| Редактировать | `PUT .../careers/{key}` | `karjera_add` (`akarjera_id = key`, `stat = 1`) |
| Удалить | `DELETE .../careers/{key}` | `DELETE FROM karjera WHERE key AND idpeople` |

Confirm удаления: «Удалить выбранную карьеру пользователя?» (в Delphi текст был «последнюю», код удалял выделенную строку — в вебе текст и код согласованы).

«Добавить» активна при выбранном человеке слева (без гейта «последняя строка» из Delphi `grKareraListClick`).

Форма `CareerFormDialog`: дата начала/окончания, должность, подразделение. Валидация только org+dolj (как Delphi). Add — всегда `dateIn=today`, `dateOut=2040-01-01`, пустые org/dolj; edit — prefill через `GET .../careers/{key}`.

### Админ-панель (позже)

| Действие | Процедура |
|----------|-----------|
| Учётка | `add_user` |
| Пароль | `change_password_strict` |

---

## 3. API

| Метод | Назначение |
|-------|------------|
| `GET /responsible-persons` | Список people |
| `GET /responsible-persons/org-units` | Select структура |
| `GET /responsible-persons/positions` | Должности |
| `GET /responsible-persons/org-tree` | Пути орг. для комбо |
| `GET /responsible-persons/{id}` | Карточка people |
| `POST/PUT/DELETE /responsible-persons[/{id}]` | CRUD people |
| `GET /responsible-persons/{id}/careers` | Список карьер (`dtEnter`/`dtOut` ISO, `orgId`/`doljId`) |
| `GET /responsible-persons/{id}/careers/{key}` | Карточка карьеры |
| `POST /responsible-persons/{id}/careers` | `karjera_add` insert |
| `PUT /responsible-persons/{id}/careers/{key}` | `karjera_add` update |
| `DELETE /responsible-persons/{id}/careers/{key}` | DELETE karjera |

ACL: `appendOrgParentSubtreeFilter` (parent).

---

## 4. UI-инфра

`DraggableDialog`, `ConfirmDialog` / `useConfirm` (`ConfirmProvider` в `App.jsx`).

---

## 5. `karjera_add` (справочно)

Параметры: `apeople, akarjera_id, datein, dateout, aorg_id, adolj_id, stat`.  
Ветка по `akarjera_id IS NULL`; `stat` в теле не читается. При отсутствии пары dolj+org создаёт `doljtostruct`.
