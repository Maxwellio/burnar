# CommonNarZadUnit (`TfrmComNarZad`) — наряд-задание, общий перечень работ

Источники: `old_delphi/CommonNarZadUnit.pas` (1691 стр.), `old_delphi/CommonNarZadUnit.dfm` (1539 стр.).
Объекты БД описаны отдельно: [delphi-commonnarzad-db.md](./delphi-commonnarzad-db.md).
Парная форма факта: [delphi-commonnarvip-form.md](./delphi-commonnarvip-form.md).

---

## 1. Назначение

MDI-дочерняя форма редактирования **плановой части наряда (наряд-задание)** для одного наряда
(`keynar`) в разрезе одного измерителя (`izmer`). Показывает **дерево работ** наряда: блоки
(разделы) и операции внутри них, с нормой времени, интервалом бурения (от/до), временем начала
работы и источником нормирования.

Задачи формы:

- построение и правка структуры наряда (drag-and-drop из справочника тематических разделов, пустые блоки, переименование, удаление, вырезание/копирование/вставка, перенумерация);
- ввод значений параметров операции (правая панель) и **расчёт нормы** серверной процедурой;
- пересчёт времён начала последующих работ после изменения нормы;
- закрытие наряда-задания от изменений и создание на его основе пустого **наряда-выполнения**;
- вспомогательные вещи: цветовая маркировка строк, поиск, шрифт, ЭКС, показ оперкарты (HTML).

Заголовок окна задаёт вызывающая сторона, шаблон:
`'Наряд-задание: ' + keynar + ', ' + frmMain.NarCaption + ', общий перечень работ'`.

---

## 2. Контракт входа

```pascal
class procedure TfrmComNarZad.OpenNar(
  aKeyNar: integer;      // код наряда (burnar.defnar.narkey)
  aorauser: string;      // логин пользователя БД, идёт в burnar.tkeydate.os_user
  aminres, amaxres: integer; // всегда -1 из MainUnit, в логике формы не используются
  aizmer: integer;       // код основного измерителя наряда (из burnar.sprnartype.izmer)
  const aCaption: string
);
```

Форма создаётся через `Create(Application)`, `FormStyle = fsMDIChild`, `Visible = True`,
закрывается с `Action := caFree` (экземпляр на наряд, не singleton).

Вызывается из:

| Место | Условие |
|-------|---------|
| `MainUnit.TfrmMain.OpenNar` | если `qrCountDefNarZad` вернул 1 (описатель задания существует) |
| `MainUnit.tbtnOpenZad1Click` | кнопка «Открыть задание», `keynar <> 0` |
| `MainUnit` после `sProcCreateNar` | сразу после создания нового наряда |

`ReloadTekNar` формы вызывают также `formStructNur` (после вставки раздела) и
`formSkvZadVar` (после правки сквозных параметров) — то есть форма обновляется **извне**.

### Глобальное состояние из `MainUnit` (для веба нужно перенести отдельно)

| Символ | Смысл |
|--------|-------|
| `frmMain.MConnection` | единственное соединение; форма шлёт через него прямой `ExecSQL` |
| `frmMain.keynar` | «текущий наряд» приложения; форма перезаписывает его в `OnActivate`/`OnPaint` |
| `frmMain.NarCaption` | описание наряда для заголовка |
| `kf` | `kedIsh / kedOut` из `SetMainCalcSetting`; коэффициент единиц измерения нормы |
| `VisibleOperDeepLevel` | глубина дерева (только для мёртвого `LoadSavedNorms`) |
| `fNFormat` | формат чисел, по умолчанию `'%-9.2f'` |
| `htmlpath` | каталог HTML-оперкарт |
| `PathAndCfgFileName` | путь к ini; от него берётся имя файла настроек формы |
| `TEditAct = (edcopy, edcut, ednone)` | режим буфера обмена |
| `oldRecsSelColor` | сохранённый цвет выделения на время «вырезания» |
| `frmStructNar.Catalog`, `SrcNode` | источник drag-and-drop (`formStructNur`) |

---

## 3. Состав UI

```
frmComNarZad (fsMDIChild, KeyPreview=True)
├── ToolBar1  (Images = frmMain.ImageList1)
│   ├── 24 ToolButton'а, привязанных к ActionList1
│   ├── sEdit1: TEdit          — строка поиска
│   └── DBLookupComboBox2      — выбор ЭКС (KeyField=ID, ListField=TREE, ListSource=DataSource1)
├── Panel1 (alClient)
│   └── trGrdNar: TOVNIDbTreeGrid   — дерево работ наряда, ColCount = 9
├── RightDockPanelSplitter / RightDockPanel (alRight, 240 px)
│   ├── GrdParams: TOVNIDbGrid (alClient, ColCount = 3) — параметры операции
│   ├── Splitter2
│   └── algInfo: TMemo (alBottom, ReadOnly)             — текст алгоритма
└── StatusBar1 (5 панелей)
```

Панели статус-бара:

| Индекс | Содержимое |
|--------|------------|
| 0 | подпись «Общая продолжительность» |
| 1 | `trGrdNar.CalcItogsNS(Root, 'n2')` — сумма норм на объём работ |
| 2 | (не используется) |
| 3 | подпись «Код операции» |
| 4 | `oper` текущей строки |

Не визуальные компоненты: `ActionList1`, `ColorDialog1`, `Image1..Image3` (иконки типов
операций), `qrEKS` → `DataSetProvider1` → `ClientDataSet1` → `DataSource1` (справочник ЭКС для
lookup-комбо), плюс 8 `TPgQuery` и 15 `TPgStoredProc` (см. db-файл).

Динамически создаваемые в `FormCreate` редакторы:

| Компонент | Родитель | Назначение |
|-----------|----------|------------|
| `cbNormEdit: TOvniComboBox` (`csSimple`) | `trGrdNar` | ручной ввод нормы `n2` для ненормируемых работ (`operlifetype = 82`) |
| `cbParValues: TOvniComboBox` | `GrdParams` | ввод/выбор значения параметра операции |

Оба используют фильтр ввода `EdKeyPress` (только цифры, один разделитель `,`, один ведущий `-`).

### Конструктор `Create`

Если рядом с ini лежит файл `<ClassName><FrmExtUserRes>` — вызывается `CreateNew` (пользовательская
раскладка). Иначе `inherited Create` + дефолтные ширины колонок
(`25/50/40/250/75/90/36/36` для дерева, `15/100/100` для параметров) и
`ExclusionFields = ['istnorm', 'Ресурс']` (исключены из автоподбора высоты строк).
В конце — `qrEKS.Open` и `ClientDataSet1.Open`.

---

## 4. Колонки дерева работ

`ReloadTekNar` → `LoadTree(qrNarZad, 'key', 'parent', 4, [скрытые поля])`.

| Поле | Заголовок | Источник в `qrNarZad` |
|------|-----------|----------------------|
| `key` | Код строки | `zadanie_oper.key` |
| `parent` | Код родителя | скрыто |
| `prnum` | № п/п | скрыто (порядок внутри уровня, `numeric`) |
| `ord` | № п/п | путь вида `1.2.3`, собирается рекурсивным CTE |
| `nm` | Название работы | `spr_oper.nm` для операции, `zadanie_anynm.nm` для блока |
| `begoperdate` | Время начала работы | `zadanie_oper.begoperdate` |
| `istnorm` | Источник нормирования | `burnar.zadanie_GetOperIst(key)` |
| `oper` | Код операции | скрыто |
| `ot` / `do_` | Интервал от / до | `zadanie_param.znach` по `parcode in burnar.ot_params` / `do_params` |
| `n1` | Н.в. на ед. измер. | `round(zadanie_norm.norma / 60, 2)` при `prnum = 1` |
| `n2` | Н.в. на объём раб. | то же при `prnum = 2` |
| `operlifeid` | — | скрыто, код «времени жизни» операции |
| `operlifetype` | Тип нормообразования | скрыто, определяет поведение (см. ниже) |
| `colorsel` | Цвет выделения | скрыто, `trGrdNar.ColorValueField` |
| `locked` | Блокировка | скрыто |
| `narkey` | Код наряда | скрыто |
| `RS` | — | скрыто, `1` если `razdel` попал в жёстко прошитый массив `13555..13566` |
| `tipbur` | ЭКС | `burnar.spr_eks.name_short` по `tipbur` |

### Коды `operlifetype`

| Код | Смысл | Поведение формы |
|-----|-------|-----------------|
| `''` (пусто) | блок / раздел | иконка `Image3`; расчёт запрещён; можно переименовать и удалить (если `RS = '0'`) |
| `78` | константа | расчёт запрещён |
| `79` | комбинация | иконка `Image1`; читаются параметры, доступен расчёт |
| `80` | алгоритм | иконка `Image1`; параметры + текст алгоритма в `algInfo` |
| `82` | ненормируемая (экспериментальная) работа | иконка `Image2`; норма `n2` вводится вручную через `cbNormEdit` |

---

## 5. Действия (`ActionList1`)

| Action | Hint / ShortCut | Обработчик | Что делает |
|--------|-----------------|------------|------------|
| `actOpenSkvZad` | Сквозные параметры, `Ctrl+Y` | `actOpenSkvZadExecute` | `TfrmSkvZadVar.CreateEx(Self, keynar)`, MDI-child |
| `actCreateCopyNarVip` | Создать пустое наряд-выполнение, `Ctrl+D` | `tbCreateCopyNarVipClick` | `CALL burnar.VIPOLNENIE_CREATE(keynar)` → открывает `TfrmComNarVip.OpenNar` |
| `actExpandNodes` | Свернуть/развернуть все узлы, `Ctrl+E` | `tbExpandNodesClick` | `FullExpand` / `FullCollapse` (кнопка-переключатель) |
| `actAutoWidthCols` | Подобрать ширины колонок, `Ctrl+L` | `tbAutoWidthColsClick` | `SetAutoWidthAllColumns` |
| `actReloadNar` | Обновить, `Ctrl+R` | `tbReloadNarClick` | `ReloadTekNar` |
| `actCalcOperAndSaveRes` | Расчёт нормы, `Ctrl+B` | `tbCalcOperClick` | rebuild-проверка + расчёт нормы + пересчёт дат (см. §6) |
| `actNarToRes` | Наряд-задание по исполнителям, `Ctrl+G` | `tbNarToResClick` | цикл по `frmMain.qrNarZadAllRes` → `TfrmNarZadRes.OpenNar`; **кнопка скрыта** (`Visible = False`) |
| `actCloseNarZad` | Закрыть задание от изменения, `Ctrl+K` | `tbCloseNarZadClick` | `CALL burnar.ZADANIE_CLOSENAR(keynar)` |
| `actDelSelOpers` | Удалить помеченные работы, `Ctrl+Del` | `tbDelSelOpersClick` | по выделенным → `burnar.ZADANIE_OPERAC_DEL` |
| `actFindWord` | Найти строку в текущем поле, `Ctrl+F` | `sSpeedButton3Click` | `trGrdNar.Locate(<текущее поле>, sEdit1.Text, ...)` |
| `actSetPlanMoment` | Задать планируемые моменты, `Ctrl+M` | — | `Enabled = False`, `Visible = False`, обработчика нет |
| `actSetWorker` | Установить исполнителя, `Ctrl+W` | `SetWorker` | модальная `TfrmSetWorker` → `update burnar.narzad set whowork` по выделенным; **кнопка скрыта** |
| `actReOrderRab` | Обновить нумерацию на данном уровне, `Ctrl+O` | `tbReOrderRabClick` | `burnar.ZADANIE_RENUMLEVEL(aParent, aNarKey)` + `UpdateTree` полей `ord`, `prnum` |
| `actCutRab` | Вырезать блок, `Ctrl+X` | `actCutRabExecute` | `fEdAct := edcut`, красит выделение `clSkyBlue`, `SortSelected` |
| `actCopyRab` | Копировать блок, `Ctrl+C` | `actCopyRabExecute` | `fEdAct := edcopy`, `SortSelected` |
| `actPasteRab` | Вставить блок, `Ctrl+V` | `actPasteRabExecute` | `Zadanie_operac_copy` или `Zadanie_operac_move` (см. §6) |
| `actShowOk` | Показать оперкарту, `Ctrl+I` | `actShowOkExecute` | `qrHtmlOk` → `TFormExplore.WebBrowser.Navigate(htmlpath + '\' + lnkfile)` для каждой ссылки |
| `actSaveSelElems` | Сохранить выделенные элементы в базе, `Shift+F2` | — | **обработчика нет** (в наряде-выполнении реализован) |
| `actSelelColorRow` | Выделить строку цветом | `actSelelColorRowExecute` | `ColorDialog1` → `update burnar.zadanie_oper set colorsel = <TColor>` |
| `actClearColor` | Снять все выделения цветом | `actClearColorExecute` | `update burnar.zadanie_oper set colorsel = 0` |
| `actZadanie_add_emptyblock` | Добавить пустой блок | `actZadanie_add_emptyblockExecute` | `InputBox` на имя → `burnar.ZADANIE_ADD_EMPTYBLOCK` → `Locate('nm', ...)` |
| `actZadanie_del_block` | Удаление блока без удаления входящих работ | `actZadanie_del_blockExecute` | `burnar.ZADANIE_OPERAC_DEL_BLOCK` |
| `actRenameBlock` | Переименовать блок | `actRenameBlockExecute` | `InputBox` → `update burnar.zadanie_anynm set nm = ... where zad_key = ...` |
| `actFontUp` / `actFontDown` | Увеличить / уменьшить шрифт | `actFontUpExecute` / `actFontDownExecute` | шаг 2 пт, границы 8..24, применяется к обоим гридам и `cbParValues` |
| `actOpenDefNar` | Открыть наряд, `Ctrl+Shift+F12` | `actOpenDefNarExecute` | `update burnar.defnarzad set closed = 0 where narkey = ...` — **без подтверждения и без обновления грида** |
| `actViewOperInfo` | Информация технологу, `Ctrl+Shift+F1` | `actViewOperInfoExecute` | MessageBox: код операции / оперлайфа / нормообразования / строки |

Кроме экшенов: `DBLookupComboBox2Click` — присвоение ЭКС (`tipbur`) всем выделенным строкам,
`SpeedButton1Click` / `SpeedButton2Click` — обработчики без кнопок в `.dfm` (мёртвый код).

### Правила доступности (`ActionList1Update`)

Пересчитываются на каждый апдейт `ActionList`:

| Action | Условие `Enabled` |
|--------|-------------------|
| `actRenameBlock`, `actZadanie_del_block` | есть узлы **и** `operlifetype = ''` **и** `locked <> '1'` **и** не закрыт **и** `RS = '0'` |
| `actCalcOperAndSaveRes` | есть узлы, `CurNode <> nil`, `RightDockPanel.Width > 50`, `CurNode.Count = 0`, не закрыт, `operlifetype ∉ {'78', ''}`, `locked <> '1'` |
| `actPasteRab` | есть узлы, `fEdAct ∈ {edcopy, edcut}`, `CurNode <> nil`, `locked <> '1'` |
| `actSelelColorRow`, `actClearColor`, `actDelSelOpers`, `actSetWorker` | есть выделенные записи и наряд не закрыт |
| `actCopyRab`, `actCutRab` | есть выделенные, не закрыт, `fEdAct = ednone` |
| `actZadanie_add_emptyblock` | наряд не закрыт |
| `actCreateCopyNarVip` | есть корневые узлы **и наряд-задание закрыт** (`lclosed`) |
| `actCloseNarZad` | наряд не закрыт |
| `actReloadNar` | `keynar > 0` |
| `actFindWord` | `sEdit1.Text <> ''` и есть видимые строки |
| `actReOrderRab`, `actAutoWidthCols` | есть видимые строки (`actReOrderRab` — ещё и не закрыт) |
| `actExpandNodes`, `actNarToRes` | есть корневые узлы |
| `actSaveSelElems` | есть корневые узлы и не закрыт (обработчика всё равно нет) |

В `ActionList1Update` не участвуют (всегда доступны): `actOpenSkvZad`, `actShowOk`,
`actViewOperInfo`, `actOpenDefNar`, `actFontUp`, `actFontDown`, `actSetPlanMoment`.

---

## 6. Процедуры и функции модуля

### Публичные

| Член | Назначение |
|------|------------|
| `constructor Create(AOwner)` | загрузка раскладки из файла или дефолтные ширины/исключения; открытие `qrEKS` + `ClientDataSet1` |
| `class procedure OpenNar(...)` | фабрика: создаёт форму, заполняет `keynar/orauser/minres/maxres/izmer/caption`, вызывает `ReloadTekNar` |
| `procedure ReloadTekNar(aKeyNar, aminres, amaxres, aizmer)` | полное перечитывание наряда (см. ниже) |
| `procedure EdKeyPress(Sender, var Key)` | фильтр ввода для обоих комбо |

Публичные поля: `orauser`, `F: TFont`, `keynar`, `minres`, `maxres`, `izmer`, `IzmerElCount`,
`lclosed`, `cbParValues`, `cbNormEdit`.

### `ReloadTekNar` — ключевая процедура

1. `trGrdNar.SaveExpandNodes('key', fieldVal)` — запомнить раскрытые узлы и позицию.
2. `lclosed := IsClosed` — признак закрытия наряда.
3. `qrNarZad` с параметром `keynar` → `LoadTree(..., 'key', 'parent', 4, [скрытые])`.
4. `ColorValueField := 'colorsel'`; `SetOperImgs(Items.Root)` — иконки типов операций.
5. `Fields.SetTitles1(...)` — русские заголовки колонок.
6. Итог `CalcItogsNS(Root, 'n2')` в `StatusBar1.Panels[1]`.
7. `BeginRebuildStruct` → `Fields.SetAtrib(i, haLeft, vaTop, cont, false, F, true)` для всех полей → `EndRebuildStruct`.
8. `LoadExpandNodes('key', fieldVal)` — восстановить раскрытие.
9. Переоткрыть `qrEKS` / `ClientDataSet1`.

### Приватные

| Метод | Назначение | Статус |
|-------|-----------|--------|
| `LoadSavedNorms` | читает `qrAllSavedNorms` (векторы норм из `getnarzad`/`calcnormzad`/`valnormzad`) в массив `tk` и раскладывает по листьям дерева | **никогда не вызывается** — мёртвый код старой схемы норм |
| `SetOperImgs(aNode)` | рекурсивно ставит битмапы по `operlifetype` (79/80 → `Image1`, 82 → `Image2`, узел → `Image3`) | активно |
| `SetSaveSel(aNode)` | восстановление выделений по полю `colorsel = '1'` | **никогда не вызывается** |
| `IsClosed: boolean` | `qrClosed` → `defnarzad.closed = 1`; побочно `GrdParams.Enabled := not result` | активно |
| `SetVal(aNode, aFieldNm, aFieldVal)` | рекурсивная установка значения поля во всём поддереве | **не вызывается извне** |

### Обработчики событий

| Обработчик | Событие | Логика |
|------------|---------|--------|
| `FormCreate` | `OnCreate` | создание `F: TFont` (размер 8), `cbNormEdit`, `cbParValues` |
| `FormClose` | `OnClose` | `Action := caFree` |
| `FormActivate` / `FormPaint` | | синхронизируют `frmMain.keynar` и включают `actGlobalParams` / `actOpenZad` главной формы |
| `FormDeactivate` | | выключают `actGlobalParams`, обнуляют `frmMain.keynar` |
| `ReadOpParams` | `trGrdNar.OnClick` | код операции в статус-бар; для `operlifetype = 82` и незакрытого наряда — показ `cbNormEdit` над ячейкой `N2`; для 79/80 — `qrParamZ` → `GrdParams.LoadDataset`, типизация значений (`ptype = 2` → `Discr`, иначе `Cont`), `ColorValueField := 'isskv'`, для 80 — текст алгоритма из `qrAlgInfo`; `GrdParams.Enabled := not lclosed` |
| `GrdParams2SelectCell` | `GrdParams.OnSelectCell` | по клику в колонке «Значение» показывает `cbParValues`: для дискретного (`ptype = 2`) наполняет из `qrAllZnTekDiscrParam` (плюс фиктивное пустое) и выбирает текущий по `КодЗначения`; для непрерывного (`ptype = 1`) форматирует число по `fNFormat` |
| `cbParValuesEnter` / `cbNormEditEnter` | `OnEnter` | запоминают исходный текст (`BeforModifyStr` / `BeforModifyNorm`) |
| `cbParValuesExit` | `OnExit` | если значение изменилось — `update burnar.zadanie_param set znach`, затем **сброс расчёта**: `update burnar.zadanie_norm set norma = null`, `delete from burnar.zadanie_ist`, обнуление `n1`/`n2`/`istnorm` в гриде |
| `cbNormEditExit` | `OnExit` | `update burnar.zadanie_norm set norma = <знач>/<kf> where zad_key = ... and prnum = 2` (обёрнуто в `DO $$ ... $$ LANGUAGE 'plpgsql'`), пересчёт итога |
| `trGrdNarMouseDown` | `OnMouseDown` | **правая** кнопка запоминает узел в `MoveOper` и запускает `BeginDrag` |
| `trGrdNarDragOver` | `OnDragOver` | принимает drop из `frmStructNar` или из грида того же наряда (сравнение по `Caption` формы-родителя) |
| `trGrdNarDragDrop` | `OnDragDrop` | два сценария (см. ниже) |
| `ActionList1Update` | `OnUpdate` | правила `Enabled` (§5) |

### `trGrdNarDragDrop` — перемещение и вставка

- **Если `MoveOper <> nil`** (перетаскивание внутри наряда): проверки «наряд закрыт», «перемещение между разными нарядами запрещено», затем `burnar.Zadanie_operac_move(akey, aparent, aprnum, newparent, newprnum, anarkey)`. Если целевая строка — пустой блок, `MessageBox` спрашивает «внутрь блока (OK) или перед блоком (Отмена)»; при OK `newparent := key` целевого узла, `newprnum := 1`.
- **Иначе** (drop из `formStructNur`): `burnar.zadanie_add_razdel(nkey, datein, aparent, aprnum, razdel, who, withname)` с `razdel = SrcNode.Cells['Код раздела']`, `withname = 1`, `datein = null`, `who = null`. Для пустого наряда — `aparent := null`, `aprnum := 1`. Тот же диалог «внутрь/перед» для пустого блока.

В обоих случаях после операции — `ReloadTekNar` и `Locate('key', loc)` для возврата курсора.

### `tbCalcOperClick` — расчёт нормы

Только для `operlifetype ∈ {79, 80}`:

1. Если `cbParValues` в фокусе — принудительный `cbParValuesExit` (иначе значение потеряется).
2. `CALL burnar.ZADANIE_REBUILD_OPER(akey, anarkey, aisrebuild)`. Если `aisrebuild = 1` — сообщение «Операция была перестроена, проверьте параметры и повторите расчёт», `ReloadTekNar`, выход.
3. Иначе `CALL burnar.ZADANIE_CALC_OPERP(akey, aoperlifeid, aizmer, normaed, normaob, istochniki, aot, ado)`; OUT-параметры пишутся в `istnorm`, `n1`, `n2`, `ot`, `do_` текущей строки.
4. `CALL burnar.SetNextDateOperZAD(key, narkey)` — сервер раскладывает новые даты в `burnar.tkeydate`.
5. `qrSetNextDateOper` (`narkey` + `os_user = orauser`) → `UpdateTree(..., 'key', ['begoperdate'])`.
6. `DELETE FROM burnar.tkeydate WHERE os_user = ... AND narkey = ...` — уборка временных строк.
7. Пересчёт итога `n2` в статус-баре.

### `actPasteRabExecute` — вставка из буфера

Если текущая строка — пустой блок, спрашивает «внутрь / перед». Затем по `fEdAct`:

- `edcopy` → цикл по `SelectedRecs` (в обратном порядке) с `burnar.Zadanie_operac_copy(key_oper, parent_oper, aparent_where_copy, aprnum_where_copy, anarkey)`;
- `edcut` → тот же цикл с `burnar.Zadanie_operac_move(...)`, затем возврат цвета выделения.

В `finally` — `fEdAct := edNone`, снятие выделений, `ReloadTekNar`, `Locate('key', loc)`.

### `tbDelSelOpersClick` — удаление помеченных

Подтверждение → `SortSelected` → цикл **с конца** по `SelectedRecs`:
`burnar.ZADANIE_OPERAC_DEL(akey, aparent, aprnum, anarkey)`, при успехе — удаление узла из памяти
(`Items.Delete`), при исключении — `AllOk := false` и MessageBox. Затем `UpdateTree` полей
`prnum`, `ord` и пересчёт итога.

---

## 7. Внешние зависимости

### Другие формы

| Модуль | Класс | Роль |
|--------|-------|------|
| `MainUnit` | `TfrmMain` | соединение, глобальные настройки, `ImageList1`, `qrNarZadAllRes` |
| `CommonNarVipUnit` | `TfrmComNarVip` | открывается из `actCreateCopyNarVip` |
| `formSkvZadVar` | `TfrmSkvZadVar` | сквозные параметры задания (`CreateEx(Self, keynar)`) |
| `formStructNur` | `TfrmStructNar` | справочник тематических разделов — источник drag-and-drop |
| `formSetWorker` | `TfrmSetWorker` | модальный выбор исполнителя |
| `formSetDate` | `TfrmSetBegDateOp` | в этом модуле только в `uses`, не используется |
| `NarZadResUnit` | `TfrmNarZadRes` | наряд-задание по исполнителю (`actNarToRes`, кнопка скрыта) |
| `UnitFormExplore` | `TFormExplore` | окно `WebBrowser` для HTML-оперкарты — **модуля нет в репозитории** |

### Библиотеки компонентов

`OvniGrids` / `OVNIDbControls` — `TOVNIDbTreeGrid`, `TOVNIDbGrid`, `TOvniComboBox`.
Используемое API грида: `LoadTree`, `UpdateTree`, `SaveExpandNodes` / `LoadExpandNodes`,
`Fields.SetTitles1` / `SetAtrib` / `SetDataTypes` / `IndexByName`, `ByFieldName`, `Recs`,
`VisRecs`, `SelectedRecs`, `SortSelected`, `CurNode`, `Items.Root`, `CalcItogsNS`,
`ColorValueField`, `ExclusionFields`, `EditedFields`, `BeginRebuildStruct` / `EndRebuildStruct`,
`Locate`, `MouseToCell`, `CellRect`, `SetAutoWidthAllColumns`, `FullExpand` / `FullCollapse`.
`PgAccess` / `DBAccess` / `MemDS` (Devart PgDAC) — `TPgQuery`, `TPgStoredProc`, `TPgConnection`.

### Include-файлы (в репозитории отсутствуют)

`{$I ProjectConst.INC}` и `{$I ProjectStr.INC}` дают как минимум: `FrmExtUserRes`,
`MsgAttentionRu`, `MsgChangeSavedRu`, `MsgDelBlock`, `MsgQuestionPodtverdit`.

---

## 8. Что учесть при переносе на веб

1. **Прямой SQL из UI.** Форма шлёт `frmMain.MConnection.ExecSQL(...)` со строковой
   конкатенацией для `colorsel`, `tipbur`, `whowork`, `zadanie_anynm.nm`, `zadanie_param.znach`,
   `zadanie_norm.norma`, `defnarzad.closed`. На вебе это отдельные endpoint'ы; конкатенация
   значений в SQL (в частности имени блока в `actRenameBlock`) — источник инъекций.
2. **`burnar.narzad` в `SetWorker`** против `burnar.zadanie_oper` во всех остальных запросах —
   расхождение имён; перед переносом надо проверить, существует ли `narzad` (возможно, легаси).
3. **Норма хранится в минутах**: чтение `round(norma / 60, 2)`, запись `norma / kf`, где
   `kf = kedIsh / kedOut` из `MainUnit.SetMainCalcSetting`. Логику коэффициента надо перенести
   вместе с формой, иначе значения разъедутся.
4. **`burnar.tkeydate` — временная таблица, разделяемая по `os_user`.** В веб-приложении с пулом
   соединений её нельзя использовать как есть: нужен возврат пересчитанных дат из процедуры
   (например, `RETURNS TABLE`) либо ключ сессии вместо имени ОС-пользователя.
5. **`RS` — массив `13555..13566` захардкожен в SQL** запроса `qrNarZad` и запрещает
   переименование/удаление системных блоков. Признак стоит вынести в справочник.
6. **Жизненный цикл `keynar` в главной форме.** `OnActivate`/`OnPaint`/`OnDeactivate`
   перезаписывают `frmMain.keynar` — на вебе это состояние активной вкладки/маршрута.
7. **Мёртвый код**: `LoadSavedNorms`, `SetSaveSel`, `SetVal`, `qrNormAtribName`, `qrCalcNorma1`,
   `sAddRab`, `sClcBegDateNextOp`, `sMoveRab`, `sORDERNAR`, `sCopyZadToVip`, `sCopyOper`,
   `actSetPlanMoment`, `actSaveSelElems`, `SpeedButton1Click`, `SpeedButton2Click`.
   Переносить не нужно, но объекты БД под ними в старой схеме могут ещё быть.
8. **Drag-and-drop правой кнопкой** (`trGrdNarMouseDown` реагирует на `mbRight`) — нетипично
   для веба, обычно заменяется левой кнопкой или явными кнопками «вставить сюда».
9. **Диалог «внутрь блока / перед блоком»** для пустого блока повторяется в трёх местах
   (drop, paste, add_razdel) — общий UX-примитив, стоит вынести в один компонент.
