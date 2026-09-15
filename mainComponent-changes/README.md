# Изменения mainComponent

Временная папка для ручного переноса в соседний репозиторий `mainComponent`
(пакет `table_comp/src/mainComponent`). После переноса этот коммит удаляется.

## Строка состояния BaseTreeTable

Скопировать в пакет (пути в `Maxwellio/mainComponent`):

- `BaseTable/BaseTreeTable.tsx` — полная версия; кроме футера остальное без правок

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
