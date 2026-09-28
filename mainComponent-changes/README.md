# Изменения mainComponent для ручного переноса

Временная папка для ручного переноса в соседний репозиторий `mainComponent`
(пакет `table_comp/src/mainComponent`). После переноса этот коммит удаляется.

## Строка состояния BaseTreeTable

Скопировать в пакет (пути в `Maxwellio/mainComponent`):

- `BaseTable/BaseTreeTable.tsx` — полная версия. Кроме футера: шапка как в `BaseTable` (`colSpan`, `rowSpan` у placeholder, пропуск нижнего дубля одиночной колонки). Подсветки группы по клику нет.

### API

Проп `statusBar` — объект флагов. Нет пропа → футера нет. Пустой объект `{}` → пустой футер.
Каждое поле футера — свой флаг.

Сейчас одно поле:

```tsx
<BaseTreeTable statusBar={{ selectedId: true }} />
```

При выборе строки в футере: `Код: {id}`. Пока строка не выбрана, полоска есть, текста нет.

Новое поле: флаг в типе `TreeStatusBar` + запись в `TREE_STATUS_BAR_FIELDS` в том же файле.

Стили футера как у `BaseTable` (`tfoot` sticky bottom). Текст в одной ячейке на всю ширину, чтобы не обрезался узкой колонкой «Код».

### Потребитель в burnar

`NaryadWorkspacePanel` передаёт `statusBar={{ selectedId: true }}` на дерево задания/выполнения.
Каталог тематических разделов — без пропа, футера нет.

Сначала скопировать файл в пакет, иначе `statusBar` уйдёт в `useReactTable` через `...props`.

## DynamicDateList (предыдущая поставка)

- `input/inputComponents.tsx` — полная изменённая версия файла
  `src/Input/InputComponents.tsx` пакета (в репозитории `Maxwellio/mainComponent`
  путь `input/inputComponents.tsx`). Изменён только компонент `DynamicDateList`,
  остальное — без правок.

1. Новый опциональный проп `yearSelectable = false` — без него поведение
   прежнее (клик по году только сворачивает/разворачивает), другие
   потребители компонента не затрагиваются.
2. С `yearSelectable` клик по невыбранному году выбирает его целиком:
   `setSelectedDate('yyyy')` + раскрытие месяцев; повторный клик по уже
   выбранному году — обычный toggle сворачивания.
3. Нормализующий `useEffect` не переписывает значение-год `'yyyy'`
   в `'yyyy-01-01'`, а только раскрывает соответствующий год.
4. У строки года добавлена подсветка `selected` (те же стили Mui-selected,
   что у месяцев). Клик по месяцу как раньше снимает выбор года.

Потребитель: `frontend/src/pages/Home.jsx` (burnar) передаёт `yearSelectable`,
а бэкенд принимает `period=yyyy` наравне с `period=yyyy-MM-dd`.

## Файл `BaseTable/BaseTreeTable.tsx`

Полная изменённая версия `BaseTable/BaseTreeTable.tsx` пакета
(основа — текущий файл со строкой состояния `statusBar`).
Изменены только классы ячейки `td` в теле таблицы и обёртка её контента.
Футер строки состояния не менялся.

В `BaseTable` строка растёт по тексту: у `td` стоит `whitespace-normal`,
внутренний `div` без `max-height`. В дереве было иначе: `max-h-10 overflow-y-auto`
ограничивал ячейку 40px и включал прокрутку внутри неё, а классы
`overflow-hedden` / `whitespase-nowrap` не действовали из-за опечаток.

Теперь ячейка дерева переносит текст так же, как `BaseTable`:
`whitespace-normal`, без потолка высоты. Отступы дерева оставлены `px-4 py-2`.

Потребители — деревья задания и выполнения и каталог тематических разделов.
В burnar у «Названия работы» и у «Наименования» каталога сняты `nowrap`
и `ellipsis` (`naryadWorkspaceColumns.jsx`, `tematicRazdelColumns.jsx`).
Таблица параметров уже на `BaseTable`, её не меняли.
