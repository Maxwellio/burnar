# Наряды — список и открытие карточки

Источники списка: Delphi `NarListUnit.pas` / `NarListUnit.dfm` (`BtnOpenNar`, `grdDefNarListDblClick` → `frmMain.OpenNar`).
Карточки: [delphi-commonnarzad-form.md](./delphi-commonnarzad-form.md), [delphi-commonnarvip-form.md](./delphi-commonnarvip-form.md).

## Статус реализации

| Часть | Статус |
|-------|--------|
| Список + боковая панель дат / структура | **сделано** |
| Кнопка «Открыть» (только при выбранной строке) | **сделано** |
| Двойной клик по строке → открыть | **сделано** |
| Маршрут `/naryad/:id` | **сделано** (заглушка) |
| Вкладки «Задание» / «Выполнение» | **сделано** (ToggleButtonGroup, без наполнения) |
| Добавить / Удалить | отложено («Удалить» уже `disabled` без выбора) |
| Наполнение форм задания и выполнения | отложено |

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

---

## 2. Страница карточки

`frontend/src/pages/NaryadPage.jsx` — заголовок «Наряд {id}» и `ToggleButtonGroup`:

| value | Подпись | Delphi |
|-------|---------|--------|
| `zad` | Задание | `TfrmComNarZad` |
| `vip` | Выполнение | `TfrmComNarVip` |

Повторный клик по уже выбранной вкладке не сбрасывает значение (как `dateMode` на списке). Область под группой пустая: позже сюда развернётся форма выбранной вкладки.

Пункт меню «Наряды» остаётся активным на `/naryad/:id`.

---

## 3. Файлы

| Файл | Роль |
|------|------|
| `frontend/src/pages/Home.jsx` | список, выбор строки, открытие |
| `frontend/src/pages/NaryadPage.jsx` | карточка-заглушка |
| `frontend/src/App.jsx` | маршрут `/naryad/:id` |
| `frontend/src/components/Navigation.jsx` | active для `/naryad/...` |
| `SpaForwardController` | forward SPA в продакшен-сборке |
