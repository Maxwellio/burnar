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
| Вкладки «Задание» / «Выполнение» | **сделано** (включаемые, нельзя снять последнюю) |
| Стартовый набор вкладок как `OpenNar` | **сделано** (`hasZadanie` / `hasVipolnenie`) |
| Action bar (подпись наряда, параметры/каталог, выход на список) | **сделано** |
| Вкладка «Задание»: дерево / параметры + алгоритм | **сделано** (таблицы пустые; правая панель тянется) |
| Вкладка «Выполнение»: тот же лейаут, отдельный инстанс | **сделано** (колонки плюс «Факт» и «Период») |
| Обе вкладки сразу: 50/50 слева-направо | **сделано** (скрытая вкладка остаётся смонтированной) |
| Добавить / Удалить | отложено («Удалить» уже `disabled` без выбора) |
| Данные деревьев, параметры, расчёт | отложено |

---

## 1. Открытие (Delphi → веб)

В Delphi кнопка «Открыть» и даблклик по гриду кладут `CodNar` в `frmMain.keynar` и вызывают `OpenNar`. Тот открывает `TfrmComNarZad` и/или `TfrmComNarVip`, если `qrCountDefNarZad` / `qrCountDefNarVip` вернул 1 (есть строка в `defnarzad` / `defnarvip`).

В вебе:

| UI | Поведение |
|----|-----------|
| Кнопка «Открыть» | `disabled`, пока нет `selectedId`; `navigate('/naryad/' + id)` |
| Двойной клик по строке | тот же `handleOpen`; `BaseTable` передаёт `row.original.id` |
| «Удалить» | `disabled` без выбранной строки; обработчика пока нет |

`id` = `defnar.key` = `NaryadListDto.id` / `codNar`.

Маршрут: `/naryad/:id`. Прямой URL в монолите отдаёт SPA через `SpaForwardController` (`/naryad`, `/naryad/**`).
Заголовок карточки: `GET /api/naryady/{id}` → `{ id, nameNar, hasZadanie, hasVipolnenie }` (тот же ACL, что у списка; 404 если нет доступа).

Стартовые вкладки (`initialOpenPanels`):

| `hasZadanie` | `hasVipolnenie` | Открыто |
|--------------|-----------------|---------|
| true | true | Задание + Выполнение |
| true | false | только Задание |
| false | true | только Выполнение |
| false | false | Задание (страница не пустая) |

---

## 2. Страница карточки

`frontend/src/pages/NaryadPage.jsx` — action bar под шапкой приложения:

| Элемент | Поведение |
|---------|-----------|
| `ToggleButtonGroup` «Задание» / «Выполнение» | **не exclusive**: обе могут быть включены; снять последнюю нельзя |
| Подпись | `Наряд - {id} {nameNar}` из `GET /api/naryady/{id}` |
| Справа | заглушки: общие параметры и каталог; **«Выйти из наряда»** (`Close`) → `navigate('/')` |

Пункт меню «Наряды» остаётся активным на `/naryad/:id`.

Рабочая область: при одной вкладке — 100%; при обеих — две колонки 50/50 (задание слева, выполнение справа), без drag-сплиттера между вкладками. Выключенная вкладка скрывается через `display: none` и **не размонтируется**, чтобы ширины колонок сохранились.

Ресайз колонок изолирован: у задания и выполнения свои массивы колонок (уникальные `id`) и свои экземпляры `BaseTreeTable` / `BaseTable`. Раньше один workspace подменял `columns` — ширины «уезжали» на соседней вкладке.

### Вкладка «Задание»

`NaryadZadaniePanel` → `NaryadWorkspacePanel`:

| Элемент | Поведение |
|---------|-----------|
| Action bar задания (48px) | пустой, кнопки позже |
| Слева | `BaseTreeTable` `GET /api/naryady/{id}/zadanie` (пока 404 → пустое тело, шапка колонок видна) |
| Справа сверху | `BaseTable` `GET /api/naryady/{id}/zadanie/params` (то же) |
| Справа снизу ~120px | read-only поле алгоритма (Delphi `algInfo`, без подписи), пока пустое |

Ширина правой панели тянется сплиттером; стартовое значение общее, в `localStorage` (`naryad-right-panel-width`). По умолчанию 25%, min 180px, max 50%. Бэкенда дерева/параметров нет: фронт только монтирует таблицы.

Колонки дерева (видимые Delphi `trGrdNar`): Код, № п/п, Название работы (expander), Время начала, Источник норм., от, до, Н.в. на ед., Н.в. на объём, ЭКС. Фильтров колонок нет.

Колонки параметров (Delphi `GrdParams`): Параметр, Значение — заголовки-заглушки до контракта API.

### Вкладка «Выполнение»

Отдельный экземпляр (`NaryadVipolneniePanel`):

| Элемент | Поведение |
|---------|-----------|
| Action bar выполнения (48px) | пустой, кнопки позже |
| Слева | `BaseTreeTable` `GET /api/naryady/{id}/vipolnenie` |
| Справа сверху | `BaseTable` `GET /api/naryady/{id}/vipolnenie/params` |
| Справа снизу ~120px | то же read-only поле алгоритма |

Колонки дерева как у задания, плюс видимые Delphi-поля «Факт» и «Период». Итоги по периодам (нижняя панель Delphi) пока не делаем.

---

## 3. Файлы

| Файл | Роль |
|------|------|
| `frontend/src/pages/Home.jsx` | список, выбор строки, открытие |
| `frontend/src/pages/NaryadPage.jsx` | карточка: action bar + две панели |
| `frontend/src/pages/naryadTabs.js` | стартовый набор и запрет снять последнюю вкладку |
| `frontend/src/pages/NaryadZadaniePanel.jsx` | вкладка задания |
| `frontend/src/pages/NaryadVipolneniePanel.jsx` | вкладка выполнения |
| `frontend/src/pages/NaryadWorkspacePanel.jsx` | раскладка одной вкладки |
| `frontend/src/pages/naryadWorkspaceColumns.jsx` | колонки деревьев и параметров (раздельные объекты) |
| `frontend/src/api/naryadyApi.js` | `fetchNaryadHeader` |
| `frontend/src/App.jsx` | маршрут `/naryad/:id` |
| `frontend/src/components/Navigation.jsx` | active для `/naryad/...` |
| `NaryadListController` `GET /{id}` | заголовок (id, nm, hasZadanie, hasVipolnenie) |
| `SpaForwardController` | forward SPA в продакшен-сборке |
