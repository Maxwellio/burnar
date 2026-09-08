# Наряды — список и открытие карточки

Источники списка: Delphi `NarListUnit.pas` / `NarListUnit.dfm` (`BtnOpenNar`, `grdDefNarListDblClick` → `frmMain.OpenNar`).
Карточки: [delphi-commonnarzad-form.md](./delphi-commonnarzad-form.md), [delphi-commonnarvip-form.md](./delphi-commonnarvip-form.md).

## Статус реализации

| Часть | Статус |
|-------|--------|
| Список + боковая панель дат / структура | **сделано** |
| Кнопка «Открыть» (только при выбранной строке) | **сделано** |
| Двойной клик по строке → открыть | **сделано** |
| Маршрут `/naryad/:id` | **сделано** |
| Вкладки «Задание» / «Выполнение» | **сделано** (ToggleButtonGroup в action bar) |
| Action bar (подпись наряда, заглушки параметров/каталога) | **сделано** |
| Вкладка «Задание»: дерево 75% / параметры + алгоритм 25% | **сделано** (таблицы пустые, без API) |
| Добавить / Удалить | отложено («Удалить» уже `disabled` без выбора) |
| Наполнение выполнения и данные задания | отложено |

---

## 1. Открытие (Delphi → веб)

В Delphi кнопка «Открыть» и даблклик по гриду кладут `CodNar` в `frmMain.keynar` и вызывают `OpenNar`. Тот открывает `TfrmComNarZad` и/или `TfrmComNarVip`, если есть строки в `defnarzad` / `defnarvip`.

В вебе:

| UI | Поведение |
|----|-----------|
| Кнопка «Открыть» | `disabled`, пока нет `selectedId`; `navigate('/naryad/' + id)` |
| Двойной клик по строке | тот же `handleOpen`; `BaseTable` передаёт `row.original.id` |
| «Удалить» | `disabled` без выбранной строки; обработчика пока нет |

`id` = `defnar.key` = `NaryadListDto.id` / `codNar`.

Маршрут: `/naryad/:id`. Прямой URL в монолите отдаёт SPA через `SpaForwardController` (`/naryad`, `/naryad/**`).
Заголовок карточки: `GET /api/naryady/{id}` → `{ id, nameNar }` (тот же ACL, что у списка; 404 если нет доступа).

---

## 2. Страница карточки

`frontend/src/pages/NaryadPage.jsx` — action bar под шапкой приложения:

| Элемент | Поведение |
|---------|-----------|
| `ToggleButtonGroup` «Задание» / «Выполнение» | на всю высоту бара (48px, как Toolbar); Delphi `TfrmComNarZad` / `TfrmComNarVip` |
| Подпись | `Наряд - {id} {nameNar}` из `GET /api/naryady/{id}` |
| Справа | заглушки: общие параметры (`GlobalVarUnit` / `actGlobalParams`) и каталог (`formStructNur` / `tbtnStructNars`) |

Повторный клик по уже выбранной вкладке не сбрасывает значение (как `dateMode` на списке).

Пункт меню «Наряды» остаётся активным на `/naryad/:id`.

### Вкладка «Задание»

`NaryadZadaniePanel` сразу под page action bar:

| Элемент | Поведение |
|---------|-----------|
| Action bar задания (48px) | пустой, кнопки позже |
| Слева 75% | `BaseTreeTable` `GET /api/naryady/{id}/zadanie` (пока 404 → пустое тело, шапка колонок видна) |
| Справа сверху | `BaseTable` `GET /api/naryady/{id}/zadanie/params` (то же) |
| Справа снизу ~120px | read-only поле «Алгоритм» (Delphi `algInfo`), пока пустое |

Доли фиксированные, без drag-сплиттера. Бэкенда дерева/параметров нет: фронт только монтирует таблицы.

Колонки дерева (видимые Delphi `trGrdNar`): Код, № п/п, Название работы (expander), Время начала, Источник норм., от, до, Н.в. на ед., Н.в. на объём, ЭКС. Фильтров колонок нет.

Колонки параметров (Delphi `GrdParams`): Параметр, Значение, Ед. изм. — заголовки-заглушки до контракта API.

Вкладка «Выполнение» пока подпись «содержимое появится позже».

---

## 3. Файлы

| Файл | Роль |
|------|------|
| `frontend/src/pages/Home.jsx` | список, выбор строки, открытие |
| `frontend/src/pages/NaryadPage.jsx` | карточка: action bar + вкладки |
| `frontend/src/pages/NaryadZadaniePanel.jsx` | раскладка задания |
| `frontend/src/pages/naryadZadanieColumns.jsx` | колонки дерева работ |
| `frontend/src/pages/naryadZadanieParamColumns.jsx` | колонки параметров |
| `frontend/src/api/naryadyApi.js` | `fetchNaryadHeader` |
| `frontend/src/App.jsx` | маршрут `/naryad/:id` |
| `frontend/src/components/Navigation.jsx` | active для `/naryad/...` |
| `NaryadListController` `GET /{id}` | заголовок карточки (id + nm) |
| `SpaForwardController` | forward SPA в продакшен-сборке |
