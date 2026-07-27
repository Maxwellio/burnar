# План: оргструктура и ACL списка нарядов

> **Для агента:** обязательные шаги — чекбоксы `- [ ]`; отмечать `- [x]` по мере выполнения.

**Цель:** ввести переиспользуемое определение оргструктуры и ACL по `sysboss`, на странице нарядов — админский Select «структура» (единицы `4,5,6,7,8` + «Все»), фильтрация как в Delphi `NarListUnit`.

**Исходники:** `bd_bur` (DDL), `old_delphi` (`NarListUnit.pas`, `MainUnit.pas`), текущий `burnar` (`NaryadListService` без ACL).

**Решения (зафиксировано с заказчиком):**

| Тема | Решение |
|------|---------|
| Объём оргструктуры | Переиспользуемый модуль (сервис ACL + read API), без CRUD дерева |
| Не-админы | ACL по своему `sysboss`-дереву; Select не показывать |
| Админы | Логины как в Delphi + `burnar_web` → `ROLE_ADMIN` |
| Пункты Select | `org_stru.id IN (4,5,6,7,8)` + «Все» |
| Поле фильтра | Орг. **автора** наряда (`narauthor` → карьера → `doljtostruct.org`) |
| Выбор единицы | Точное совпадение `org = id` (не потомки) |
| UI | Справа на панели действий; label «структура»; по умолчанию «Все»; без пустой строки |

---

## Почему не «только фильтр нарядов»

Оргструктура понадобится и в других разделах для показа только допустимых данных. Поэтому закладываем **общий backend-модуль**, а экран нарядов — первый потребитель:

1. Резолв орг. текущего пользователя и множества доступных `org_stru.id` по `sysboss`.
2. Готовый SQL-фрагмент / helper для «org автора ∈ access set».
3. Read-only API справочника единиц для админского фильтра.
4. CRUD `org_stru` и UI дерева — **вне скоупа** (данные уже в БД).

Это ближе к варианту «сущность/сервис без UI редактирования», но с упором на **ACL-сервис**, а не на JPA-CRUD.

---

## Архитектура

```
┌─ frontend ─────────────────────────────────────────────┐
│ Home.jsx: Select «структура» (ROLE_ADMIN)              │
│ filters += { orgUnitId } | без параметра при «Все»     │
└────────────────────────┬───────────────────────────────┘
                         │ GET /api/naryady?orgUnitId=
                         │ GET /api/org-units  (admin)
┌─ backend ──────────────▼───────────────────────────────┐
│ OrgAccessService                                        │
│  - isAdmin(username)                                    │
│  - resolveUserOrgId(username)  // karjera→doljtostruct  │
│  - accessibleOrgIds(username)  // recursive sysboss     │
│  - appendAuthorOrgAcl(sql, params, username, orgUnitId) │
│ NaryadListService — вызывает ACL в WHERE (+ /periods)   │
│ UserDetailsServiceImpl — ROLE_ADMIN по списку логинов   │
└────────────────────────────────────────────────────────┘
                         │
┌─ DB burnar ────────────────────────────────────────────┐
│ org_stru (parent, sysboss)                              │
│ users → people → karjera → doljtostruct.org             │
│ defnar.narauthor → users (автор)                        │
└────────────────────────────────────────────────────────┘
```

**Семантика ACL (как Delphi `BitBtn2Click`):**

```sql
AND author_org.org IN (
  WITH RECURSIVE tr AS (
    SELECT c.id FROM burnar.org_stru c
    WHERE c.id = :userOrgId          -- орг. текущего пользователя
    UNION ALL
    SELECT c.id FROM burnar.org_stru c
    INNER JOIN tr ON c.sysboss = tr.id
  )
  SELECT tr.id FROM tr
  [WHERE tr.id = :orgUnitId]         -- только если админ выбрал не «Все»
)
```

`author_org` — join автора наряда к актуальной карьере (как в Delphi: `k.dtenter <= current_date`, `ds.key = k.doljinstru`), без фильтра по потомкам выбранной единицы.

**Админы (конфиг, case-insensitive):** `burnar_role`, `ievc`, `burnar_web`.  
(В `formUsersDoljn` ещё фигурирует `burnar` — при необходимости добавить в тот же список конфига.)

---

## Задачи

### Task 0: Ветка

- [ ] `git checkout -b cursor/org-structure-acl-baae` от актуального `main`

---

### Task 1: Конфиг админов + ROLE_ADMIN

**Файлы:**
- `backend/src/main/resources/application.yml`
- `backend/.../config/AdminUsersProperties.java` (новый)
- `backend/.../security/UserDetailsServiceImpl.java`
- при необходимости `backend/.../dto/CurrentUserDto.java` (без обязательных новых полей — роль уже уходит в `roles`)

- [ ] В `application.yml` добавить список:

```yaml
burnar:
  admin-users:
    - burnar_role
    - ievc
    - burnar_web
```

- [ ] `@ConfigurationProperties` + enable в приложении/конфиге.
- [ ] В `UserDetailsServiceImpl`: если `ora_name` (ignoreCase) в списке → authorities `ROLE_USER` + `ROLE_ADMIN`, иначе только `ROLE_USER`.
- [ ] Проверка: `GET /api/current-user` для `burnar_web` содержит `ROLE_ADMIN`.

---

### Task 2: OrgAccessService (ядро для переиспользования)

**Файлы (новые):**
- `backend/.../service/OrgAccessService.java`
- `backend/.../dto/OrgUnitDto.java` — `{ id, name }`

- [ ] `Optional<Integer> resolveUserOrgId(String username)` — SQL по образцу login/`qrUser`:

```sql
SELECT DISTINCT ds.org
FROM burnar.users u
JOIN burnar.karjera k ON k.idpeople = u.people_id
JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru
WHERE UPPER(u.ora_name) = UPPER(:username)
  AND k.dtenter <= CURRENT_DATE
```

  Если несколько строк — как в Delphi (`distinct`); зафиксировать выбор (например, первая / любая distinct в CTE root). Если орг не найдена — доступный set пустой (список нарядов пуст), не падать 500.

- [ ] `boolean isAdmin(Authentication|String username)` — по тому же списку, что Task 1 (или проверка `ROLE_ADMIN`).

- [ ] Метод, возвращающий SQL-фрагмент + биндинг параметров для ACL автора (см. архитектуру).  
  Параметр `orgUnitId`:
  - `null` / отсутствует → без `WHERE tr.id = …` (эквивалент «Все», но всё ещё внутри дерева пользователя);
  - задан → точное `tr.id = :orgUnitId`;
  - для **не-админа** игнорируется даже если пришёл в query (безопасность: нельзя расширить доступ).

- [ ] `List<OrgUnitDto> listFilterOrgUnits()` — `WHERE id IN (4,5,6,7,8) ORDER BY nm` (как `LoadCBX`). ID вынести в тот же конфиг (`burnar.org-filter-ids`), чтобы не размазывать магические числа.

---

### Task 3: API справочника оргединиц

**Файлы:**
- `backend/.../controller/OrgUnitController.java` (новый)
- `backend/.../config/SecurityConfig.java` — при необходимости `@PreAuthorize` / `hasRole('ADMIN')`

- [ ] `GET /api/org-units` → список для Select; только `ROLE_ADMIN` (403 иначе).
- [ ] Ответ без пункта «Все» — «Все» добавляет только фронт как sentinel-значение.

---

### Task 4: ACL в списке нарядов и дереве периодов

**Файлы:**
- `backend/.../dto/NaryadListFilter.java` — поле `Integer orgUnitId`
- `backend/.../controller/NaryadListController.java` — query-param `orgUnitId`
- `backend/.../service/NaryadListService.java`

- [ ] В `FROM`/`WHERE` добавить join автора к `userstru` (орг. автора) и условие `OrgAccessService` по текущему `SecurityContext` username.
- [ ] Пробросить `orgUnitId` из контроллера в filter; применять обрезку только для админа.
- [ ] **Тот же ACL** в `findPeriodTree` /periods — иначе сайдбар месяцев будет показывать периоды по чужим нарядам.
- [ ] Убрать/обновить комментарий «без ACL по оргструктуре».
- [ ] Ручная/интеграционная проверка сценариев:
  - обычный пользователь — только наряды авторов из своего `sysboss`-поддерева; `orgUnitId` в query не расширяет выдачу;
  - админ + «Все» — всё своё дерево;
  - админ + единица `5` — только авторы с `org = 5` (и `5` ∈ дереве админа).

---

### Task 5: Frontend — Select «структура»

**Файлы:**
- `frontend/src/api/orgUnitsApi.js` (новый)
- `frontend/src/pages/Home.jsx`
- `frontend/src/utils/roles.js` — уже есть `hasAnyRole`; при необходимости хелпер `isAdmin(user)`

- [ ] `fetchOrgUnits()` → `GET /api/org-units`.
- [ ] В `Home.jsx` при `hasAnyRole(user.roles, ['ROLE_ADMIN'])`:
  - справа на панели кнопок (`ml: 'auto'` / `justifyContent: 'space-between'`) MUI `FormControl` + `InputLabel` **«структура»** + `Select`;
  - options: `{ value: '', label: 'Все' }` + единицы с API;
  - **нет** `displayEmpty` с пустой строкой-заглушкой: значение по умолчанию сразу `'all'` или `''` трактуемое как «Все», выбранный пункт всегда виден;
  - при смене — писать в `filters` `{ id: 'orgUnitId', value }` только если не «Все»; при «Все» убирать ключ из filters;
  - подмешивать вместе с `dateMode`/`period` в `injectSidebarFilters` (или отдельный inject), чтобы BaseTable не затирал.
- [ ] Для не-админов Select не рендерить; `orgUnitId` в filters не слать.
- [ ] Загрузка списка единиц один раз при монтировании (если админ); ошибка 403/сети — Select скрыть или показать disabled с «Все» (не ломать страницу).

---

### Task 6: Согласованность current-user и меню

**Файлы:**
- `frontend/src/config/menuItems.jsx` — пункт Админ уже ждёт `ROLE_ADMIN` (после Task 1 начнёт отображаться — ок).
- При необходимости не трогать stub `/admin`.

- [ ] Убедиться, что после логина админа меню «Админ-панель» появляется без отдельных правок (следствие Task 1).

---

### Task 7: Проверка и сдача

- [ ] Backend: компиляция / точечные тесты `OrgAccessService` (unit с моком JDBC или `@JdbcTest`, если среда позволяет).
- [ ] Frontend: страница нарядов — Select только у админа, default «Все», фильтр перезагружает таблицу.
- [ ] Commit + push + PR с кратким описанием семантики ACL и списка админ-логинов.

---

## Порядок внедрения

```
Task 1 (роли) → Task 2 (OrgAccessService) → Task 3 (API org-units)
    → Task 4 (ACL naryady + periods) → Task 5 (UI Select) → Task 6/7
```

Tasks 3 и 5 можно частично параллелить после Task 2; Task 4 зависит от Task 2.

---

## Вне скоупа (следующие этапы)

- CRUD / визуальный редактор дерева `org_stru`
- ACL по `org_stru_tem_cat` (тематический каталог)
- Фильтрация по орг. бригады (`spr_workers.org`) вместо/вместе с автором
- Поддерево выбранной единицы вместо exact match
- Таблица ролей в БД вместо списка логинов
- Привязка кнопок Добавить/Редактировать/Удалить к правам

---

## Риски

1. **У админ-логина нет карьеры/орг.** — ACL-дерево пустое, список пуст. Нужны корректные данные в `karjera`/`doljtostruct` для `burnar_role` / `burnar_web` / `ievc`, либо временный bypass «админ без орг = видеть всё» (только по явному решению; в Delphi такого bypass в SQL списка нет).
2. **Несколько активных `karjera`** у автора/пользователя — Delphi берёт `distinct` org; возможны дубли join. Сохраняем поведение Delphi.
3. **Магические ID 4–5–6–7–8** завязаны на прод-данные; вынести в конфиг.
4. **`/periods` без ACL** даст рассинхрон сайдбара и таблицы — поэтому ACL обязателен и там.
