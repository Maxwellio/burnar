# CommonNarVipUnit (`TfrmComNarVip`) — наряд-выполнение, общий перечень работ

Источники: `old_delphi/CommonNarVipUnit.pas` (2338 стр.), `old_delphi/CommonNarVipUnit.dfm` (2019 стр.).
Объекты БД описаны отдельно: [delphi-commonnarvip-db.md](./delphi-commonnarvip-db.md).
Парная форма плана: [delphi-commonnarzad-form.md](./delphi-commonnarzad-form.md).

---

## 1. Назначение

MDI-дочерняя форма **фактической части наряда (наряд-выполнение)** для одного наряда (`keynar`)
в разрезе одного измерителя (`izmer`). Структурно это «наряд-задание + факт»: то же дерево работ,
но с редактируемой колонкой **«Факт»**, периодами выполнения, блокировкой отдельных работ и
панелью итогов по периодам.

Что умеет форма помимо задания:

- ввод факта по работе с применением **правил корреляции** `burnar.factkorr` через встроенный интерпретатор Паскаль-выражений (`TPasCalc`);
- блокировка / разблокировка отдельных работ (`locked`) — заблокированную работу нельзя менять, перемещать, удалять и вставлять перед ней;
- привязка выделенных работ к **периоду выполнения** и настройка самих периодов;
- импорт всех работ из наряда-задания (`ZADANIE_TO_VIPOLNENIE`) и обратная замена задания выполнением (`Copy_Vip_to_Zad`, только для орг. единиц 1 и 8);
- ручная установка фактической даты начала работы (`EDITDATE = 1`);
- признак «Д» (`priznak`) на поддерево работ;
- панель **итогов по периодам** (норматив / ремонт / факт) и интервалы механического бурения.

Заголовок окна: `'Наряд-выполнение: ' + keynar + ', ' + frmMain.NarCaption + ', общий перечень работ'`.

---

## 2. Контракт входа

```pascal
class procedure TfrmComNarVip.OpenNar(
  aKeyNar: integer;          // код наряда
  aorauser: string;          // логин пользователя БД → burnar.tkeydate.os_user
  aminres, amaxres: integer; // всегда -1, в логике не используются
  aizmer: integer;           // код основного измерителя наряда
  const aCaption: string
);
```

`Create(Application)`, `FormStyle = fsMDIChild`, `FormClose → caFree`.

Вызывается из:

| Место | Условие |
|-------|---------|
| `MainUnit.TfrmMain.OpenNar` | если `qrCountDefNarVip` вернул 1 |
| `MainUnit.tbtnOpenVip1Click` | кнопка «Открыть выполнение» |
| `CommonNarZadUnit.tbCreateCopyNarVipClick` | сразу после `burnar.VIPOLNENIE_CREATE(keynar)` |

Извне форму обновляют `formStructNur` (после вставки раздела) и `formSkvVipVar`
(`qrNarvip.Open` + `UpdateTree` полей `istnorm`, `n1`, `n2`; также читает `lLocked`).

Глобальное состояние из `MainUnit` — то же, что у задания, плюс `frmMain.Org` (код орг. единицы,
определяет видимость `ToolButton23`) и `frmMain.MDIChildCount` / `MDIChildren` (для обновления
открытых форм задания).

---

## 3. Состав UI

```
frmComNarVip (fsMDIChild)
├── ToolBar1 (Images = frmMain.ImageList1)
│   ├── ToolButton1..ToolButton24 — привязаны к ActionList1
│   ├── sEdit1: TEdit             — строка поиска (и «приёмник» текста ошибок сервера)
│   └── DBLookupComboBox1         — выбор ЭКС (ID / TREE, ListSource = DataSource1)
├── Panel1 (alClient)
│   ├── trGrdNar: TOVNIDbTreeGrid (alClient, ColCount = 10) — дерево работ + факт
│   ├── Splitter1 (crVSplit)
│   └── Panel2 (alBottom) — блок «Итоги по периодам»
│       ├── Label1 «Итоги по периодам:»
│       ├── SpeedButton2   — «Обновить итоги»
│       ├── sbShowItogi    — «Показать итоги»
│       ├── sbHideItogi    — «Скрыть итоги»
│       └── grItog: TOVNIDbGrid (alBottom, PopupMenu1 → N1 «Обновить»)
├── RightDockPanelSplitter / RightDockPanel (alRight)
│   ├── GrdParams: TOVNIDbGrid (alClient, ColCount = 3)
│   ├── Splitter2
│   └── algInfo: TMemo (alBottom, ReadOnly) — текст алгоритма и ошибки интерпретатора
└── StatusBar1 (8 панелей)
```

Панели статус-бара:

| Индекс | Содержимое |
|--------|------------|
| 0 | подпись «Общая нормативная продолжительность» |
| 1 | `CalcItogsNS(Root, 'n2')` |
| 2 | (не используется) |
| 3 | подпись «Общая фактическая продолжительность» |
| 4 | `CalcItogsNS(Root, 'fact')` |
| 5, 6 | подпись «Код операции» |
| 7 | `oper` текущей строки |

Не визуальные: `ActionList1`, `ColorDialog1`, `PopupMenu1`, `Image1..Image5`,
`qrEKS` → `DataSetProvider1` → `ClientDataSet1` → `DataSource1`, плюс 11 `TPgQuery` и
17 `TPgStoredProc`.

Иконки: `Image1` — комбинация/алгоритм (79/80), `Image2` — ненормируемая (82),
`Image3` — блок/структура, `Image4` — есть правило корреляции (`kor = '1'`, ставится в колонку
`n2`), `Image5` — работа заблокирована (`locked = '1'`, ставится в колонку `ord`).

`cbParValues: TOvniComboBox` создаётся в `FormCreate` на `GrdParams`. Отдельного `cbNormEdit`
здесь нет — факт вводится штатным редактором грида (`trGrdNar.CellEditorEx`), на который
навешен `KeyPressCellGrid`.

### Конструктор `Create`

Как у задания (файл раскладки → `CreateNew`, иначе дефолты), плюс: `panelheight := 160`,
`Panel2.Height := 30`, `sbHideItogi.Visible := False`, `sbShowItogi.Visible := True`
(итоги свёрнуты), `trGrdNar.ColWidths[9] := 58` (колонка «Факт»).

### `FormCreate`

`F := TFont` (размер 8); `ToolButton23.Visible := (frmMain.Org = 1) or (frmMain.Org = 8)`;
создание `cbParValues`; `trGrdNar.CellEditorEx.OnKeyPress := KeyPressCellGrid`.

---

## 4. Колонки дерева работ

`LoadTree(qrNarVIP, 'key', 'parent', 4, ['parent','prnum','oper','operlifeid','operlifetype','colorsel','locked','narkey','kor','RS'])`.

К набору наряда-задания добавлены:

| Поле | Заголовок | Источник |
|------|-----------|----------|
| `fact` | Факт | `round(vipolnenie_norm.fact / 60, 2)` при `prnum = 2` — **единственное редактируемое поле** (`EditedFields.Add('Fact')`, тип `number`) |
| `kor` | — | скрыто: `1`, если для `operlifeid` есть строка в `burnar.factkorr` |
| `period_nm` | Период | `vipolnenie_period.nm || ' (dd.mm.yyyy - dd.mm.yyyy)'` |
| `tipbur` | ЭКС | `burnar.spr_eks.name_short` |

Остальное совпадает с заданием (`key`, `parent`, `prnum`, `ord`, `nm`, `begoperdate`, `istnorm`,
`oper`, `ot`, `do_`, `n1`, `n2`, `operlifeid`, `operlifetype`, `colorsel`, `locked`, `narkey`, `RS`),
но берётся из `burnar.vipolnenie_*` вместо `burnar.zadanie_*`, а имя блока — из
`burnar.vipolnenie_anynm`. Источник нормирования — `burnar.vipolnenie_GetOperIst(key)`.

Отличие в колонке `ord`: к пути добавляется буква **«Д»**, если `vipolnenie_oper.priznak = 1`.

### Коды `operlifetype`

Как в задании (`''` — блок, `78` — константа, `79` — комбинация, `80` — алгоритм,
`82` — ненормируемая), плюс **`81`**: в `trGrdNarSelectCell` для `81` и `''` выделение строки
запрещено (`CanSelect := False`), как и для любой строки с `locked = '1'`.

---

## 5. Действия (`ActionList1`)

| Action | Hint / ShortCut | Обработчик | Что делает |
|--------|-----------------|------------|------------|
| `actOpenSkvVip` | Сквозные параметры, `Ctrl+Y` | `actOpenSkvVipExecute` | `TfrmSkvVipVar.CreateEx(Self, keynar)` |
| `actExpandNodes` | Свернуть/развернуть все, `Ctrl+E` | `tbExpandNodesClick` | `FullExpand` / `FullCollapse` |
| `actAutoWidthCols` | Подобрать ширины, `Ctrl+L` | `tbAutoWidthColsClick` | `SetAutoWidthAllColumns` |
| `actReloadNar` | Обновить, `Ctrl+R` | `tbReloadNarClick` | `ReloadTekNar` |
| `actCalcOperAndSaveRes` | Расчёт нормы, `Ctrl+B` | `tbCalcOperClick` | rebuild-проверка + расчёт + пересчёт дат (§6) |
| `actNarToRes` | Наряд-выполнение по исполнителям, `Ctrl+G` | `tbNarToResClick` | цикл по `frmMain.qrNarVipAllRes` → `TfrmNarVipRes.OpenNar` |
| `actCloseNarVip` | Закрыть выполнение от изменения, `Ctrl+K` | `tbCloseNarZadClick` | требует, чтобы **все** работы были заблокированы, затем `update burnar.defnarvip set closed = 1` |
| `actDelSelOpers` | Удалить помеченные работы, `Ctrl+Del` | `tbDelSelOpersClick` | отказ, если среди выделенных есть `locked = '1'`; иначе `burnar.VIPOLNENIE_OPERAC_DEL` |
| `actFindWord` | Найти строку, `Ctrl+F` | `sSpeedButton3Click` | `trGrdNar.Locate` |
| `actSetFactMoment` | Задать фактические моменты, `Ctrl+M` | — | `Enabled = False`, `Visible = False` |
| `actSetWorker` | Установить исполнителя, `Ctrl+W` | `SetWorker` | `TfrmSetWorker` → `update burnar.narvip set whowork` |
| `actReOrderRab` | Перенумеровать работы, `Ctrl+O` | `tbReOrderRabClick` | `burnar.VIPOLNENIE_RENUMLEVEL` + `UpdateTree(['ord','prnum'])` |
| `actSaveFact` | Сохранить фактические значения в базе, `Ctrl+Y` | — | **обработчика нет**: факт пишется сразу в `trGrdNarCellValChange` |
| `actCutRab` | Вырезать блок, `Ctrl+X` | `actCutRabExecute` | отказ при заблокированных в выделении; иначе `fEdAct := edcut` |
| `actCopyRab` | Копировать блок, `Ctrl+C` | `actCopyRabExecute` | `fEdAct := edcopy` |
| `actPasteRab` | Вставить блок, `Ctrl+V` | `actPasteRabExecute` | `VIPOLNENIE_OPERAC_COPY` / `VIPOLNENIE_OPERAC_MOVE` |
| `actShowOk` | Показать оперкарту, `Ctrl+I` | `actShowOkExecute` | `qrHtmlOk` → `TFormExplore` на каждый `lnkfile` |
| `actSaveSelElems` | Сохранить выделенные, `Shift+F2` | `actSaveSelElemsExecute` | `update burnar.narvip set sel = null where narkey = ...`, затем `sel = 1` по выделенным |
| `actSelelColorRow` | Выделить строку цветом | `actSelelColorRowExecute` | `update burnar.vipolnenie_oper set colorsel = <TColor>` |
| `actClearColor` | Снять выделения цветом | `actClearColorExecute` | `colorsel = 0` |
| `actVipolnenie_add_emptyblock` | Добавить пустой блок | `actVipolnenie_add_emptyblockExecute` | `InputBox` → `burnar.VIPOLNENIE_ADD_EMPTYBLOCK` |
| `actVipolnenie_del_block` | Удаление блока без удаления входящих работ | `actVipolnenie_del_blockExecute` | `burnar.VIPOLNENIE_OPERAC_DEL_BLOCK` |
| `actRenameBlock` | Переименовать блок | `actRenameBlockExecute` | `update burnar.vipolnenie_anynm set nm = ...` |
| `actFontUp` / `actFontDown` | Шрифт +/− | `actFontUpExecute` / `actFontDownExecute` | шаг 2 пт, 8..24 |
| `actImportRabZad` | Импортировать работы из задания | `actImportRabZadExecute` | выход, если в выполнении уже есть работы («костыль» по комментарию); иначе `burnar.ZADANIE_TO_VIPOLNENIE(nkey, datein = null)` |
| `actLockOper` | Блокировать текущую работу | `actLockOperExecute` | `burnar.VIPOLNENIE_LOCK_OPER(akey, anarkey)`; ошибки сервера разбираются через `frmMain.Get_ORA_Exception` и фрагмент между `*` и `#` кладётся в `sEdit1.Text` |
| `actUnLockOper` | Разблокировать работу | `actUnLockOperExecute` | `burnar.VIPOLNENIE_UN_LOCK_OPER(akey, anarkey)` |
| `actOpenNarVip` | Открыть наряд, `Ctrl+Shift+F12` | `actOpenNarVipExecute` | `update burnar.defnarvip set closed = 0` — **без подтверждения** |
| `actListPeriod` | Настройка периодов выполнения работ | `actListPeriodExecute` | `TfrmListPeriod` (модально) → `UpdateTree(['period_nm'])` |
| `actSelPeriodOper` | Привязать выделенные операции к периоду | `actSelPeriodOperExecute` | требует, чтобы **все** выделенные были заблокированы; `TfrmSetPeriod` → `update burnar.vipolnenie_oper set PERIOD = ...` |
| `actViewOperInfo` | Информация технологу, `Ctrl+Shift+F1` | `actViewOperInfoExecute` | MessageBox с кодами операции / оперлайфа / нормообразования |
| `actsetdateHANDmla` | Установка фактической даты выполнения работы | `actsetdateHANDmlaExecute` | `TfrmSetBegDateOp` → `update burnar.vipolnenie_oper set BEGOPERDATE = to_timestamp(...), EDITDATE = 1` |
| `ActSetD` | (признак «Д») | `ActSetDExecute` | рекурсивный CTE по поддереву → `set priznak = 1` |
| `ActSetNotD` | (снять признак «Д») | `ActSetNotDExecute` | тот же CTE → `set priznak = 0` |
| `actIntervals` | (интервалы мех. бурения) | `actIntervalsExecute` | `TfrmMehBurIntervals.loadlistIntervals(keynar)` модально |

Отдельно от `ActionList`:

| Обработчик | Элемент | Что делает |
|------------|---------|------------|
| `DBLookupComboBox1Click` | комбо ЭКС | `update burnar.vipolnenie_oper set tipbur = ...` по всем выделенным |
| `ToolButton23Click` | «Заменить задание на выполнение» (видна при `Org ∈ {1, 8}`) | `CALL burnar.Copy_Vip_to_Zad(nkey => keynar)` + `ReloadTekNar` во всех открытых `TfrmComNarZad` |
| `N1Click` | пункт «Обновить» в `PopupMenu1` грида итогов | `qrITOGtable` → `grItog.LoadDataset` + заголовки (вариант с вахтовыми колонками) |
| `SpeedButton2Click` | кнопка «Обновить итоги» | то же, но набор заголовков без вахтовых колонок |
| `sbShowItogiClick` / `sbHideItogiClick` | показать/скрыть итоги | переключают `Panel2.Height` между `panelheight` и `30`, `Splitter1.Visible` |

### Правила доступности (`ActionList1Update`)

| Action | Условие `Enabled` |
|--------|-------------------|
| `actVipolnenie_add_emptyblock` | есть узлы, `locked <> '1'`, не закрыт |
| `actRenameBlock`, `actVipolnenie_del_block` | есть узлы, `operlifetype = ''`, `locked <> '1'`, не закрыт, `RS = '0'` |
| `actCalcOperAndSaveRes` | есть узлы, `CurNode <> nil`, `RightDockPanel.Width > 50`, лист, не закрыт, `operlifetype ∉ {'78', ''}`, `locked <> '1'` |
| `actsetdateHANDmla` | есть узлы, `CurNode <> nil`, `locked <> '1'`, не закрыт |
| `actPasteRab` | есть узлы, `fEdAct ∈ {edcopy, edcut}`, `CurNode <> nil`, `locked <> '1'`, не закрыт |
| `actLockOper` | есть узлы, `locked = '0'`, не закрыт |
| `actUnLockOper` | есть узлы, `locked = '1'`, не закрыт |
| `actSelelColorRow`, `actClearColor`, `actDelSelOpers`, `actSetWorker` | есть выделенные, не закрыт |
| `actCopyRab`, `actCutRab`, `actSelPeriodOper` | есть выделенные, не закрыт, `fEdAct = ednone` |
| `actImportRabZad` | не закрыт **и** нет заблокированных работ (`not llocked`) |
| `actSaveFact`, `actReOrderRab` | есть видимые строки, не закрыт |
| `actAutoWidthCols` | есть видимые строки |
| `actCloseNarVip` | не закрыт |
| `actNarToRes`, `actExpandNodes` | есть корневые узлы |
| `actSaveSelElems` | есть корневые узлы, не закрыт |
| `actReloadNar` | `keynar > 0` |
| `actFindWord` | `sEdit1.Text <> ''` и есть видимые строки |

В `ActionList1Update` не участвуют (всегда доступны): `actOpenSkvVip`, `actShowOk`,
`actViewOperInfo`, `actListPeriod`, `actOpenNarVip`, `actIntervals`, `ActSetD`, `ActSetNotD`,
`actFontUp`, `actFontDown`, `actSetFactMoment`.

---

## 6. Процедуры и функции модуля

### Публичные

| Член | Назначение |
|------|------------|
| `constructor Create(AOwner)` | раскладка/дефолты, свёрнутая панель итогов, `qrEKS.Open` |
| `class procedure OpenNar(...)` | фабрика формы (см. §2) |
| `procedure ReloadTekNar(aKeyNar, aminres, amaxres, aizmer)` | полное перечитывание наряда |
| `procedure EdKeyPress(Sender, var Key)` | фильтр ввода `cbParValues` |

Публичные поля: `orauser`, `panelheight`, `keynar`, `minres`, `maxres`, `izmer`, `IzmerElCount`,
`F: TFont`, `lclosed`, `llocked`, `lunlock`, `fEnter`, `fBell`, `fBellDC`, `cbParValues`.

`fBell` — служебный флаг: `True`, если правило корреляции сработало, тогда `KeyPressCellGrid`
не переводит курсор на строку ниже.

### `ReloadTekNar`

1. `SaveExpandNodes('key', fieldVal)`.
2. `lclosed := IsClosed`; `llocked := IsLocked`.
3. `qrNarVip` (`keynar`) → `LoadTree(..., 4, [скрытые])`; `ColorValueField := 'colorsel'`.
4. `SetOperImgs(Items.Root)` — иконки типа операции, корреляции и блокировки.
5. `Fields.SetTitles1(...)`; `EditedFields.Add('Fact')`; трюк `ColWidths[0] ±1` для перерисовки.
6. Итоги `n2` (панель 1) и `fact` (панель 4) в статус-бар.
7. `SetAtrib` по всем полям + `Fields.SetDataTypes(['Fact'], number)`.
8. `LoadExpandNodes`; переоткрытие `qrEKS` / `ClientDataSet1`.

### Приватные

| Метод | Назначение | Статус |
|-------|-----------|--------|
| `SaveNormaAndFact(aNode)` | одним `ExecSQL`: `vipolnenie_norm.fact` + `norma` для `prnum = 1` и `prnum = 2` (значения делятся на `kf`) | активно, из `trGrdNarCellValChange` |
| `SaveFact(aNode)` | только `vipolnenie_norm.fact` (без указания `prnum` — пишет во все строки нормы узла) | активно, когда правил корреляции нет |
| `LoadSavedNorms` | чтение векторов норм/факта из `getnarvip` / `calcnormvip` / `valnormvipfact` | **никогда не вызывается** — мёртвый код |
| `SetOperImgs(aNode)` | рекурсивная расстановка иконок | активно |
| `SetSaveSel(aNode)` | восстановление выделений по полю `sel` | **никогда не вызывается** |
| `IsClosed: boolean` | `qrClosed` → `defnarvip.closed = 1` | активно |
| `IsLocked: boolean` | `qrLocked` → есть ли работы с `locked = 1` | активно |
| `IsUnLocked: boolean` | `qrUnLock` → есть ли работы с `locked = 0` (проверка перед закрытием наряда) | активно |
| `SetVal(aNode, ...)` | рекурсивная установка поля в поддереве | **не вызывается** |
| `KeyPressCellGrid(Sender, var Key)` | при `Key = #0` (Enter в редакторе) переводит курсор на строку ниже, если `fBell <> True` | активно |

### Обработчики событий

| Обработчик | Событие | Логика |
|------------|---------|--------|
| `FormCreate` | `OnCreate` | шрифт, видимость `ToolButton23` по `frmMain.Org`, `cbParValues`, `CellEditorEx.OnKeyPress` |
| `FormClose` | `OnClose` | `caFree` |
| `FormActivate` / `FormPaint` | | синхронизация `frmMain.keynar`, включение `actGlobalParams`, `actOpenZad`, `actOpenVip` |
| `FormDeactivate` | | выключение `actGlobalParams`, `frmMain.keynar := 0` |
| `ReadOpParams` | `trGrdNar.OnClick` | код операции в панель 7; для 79/80 — `qrParamV` → `GrdParams.LoadDataset`, типизация значений, `ColorValueField := 'isskv'`, для 80 — `qrAlgInfo` в `algInfo`; `GrdParams.Enabled := locked <> '1'` |
| `trGrdNarSelectCell` | `OnSelectCell` | `CanSelect := False` для `locked = '1'` и для `operlifetype ∈ {'81', ''}` |
| `trGrdNarCellValChange` | `CellValChange` | ввод факта с правилами корреляции (см. ниже) |
| `GrdParamsSelectCell` | `GrdParams.OnSelectCell` | как в задании: показ `cbParValues`, наполнение из `qrAllZnTekDiscrParam` для дискретных, форматирование по `fNFormat` для непрерывных |
| `cbParValuesEnter` / `cbParValuesExit` | | запоминание и сохранение: `update burnar.vipolnenie_param set znach`, затем сброс расчёта (`vipolnenie_norm.norma = null`, `delete from burnar.vipolnenie_ist`, обнуление `n1`/`n2`/`istnorm`) |
| `trGrdNarMouseDown` | `OnMouseDown` | **правая** кнопка → `MoveOper` + `BeginDrag` |
| `trGrdNarDragOver` | `OnDragOver` | drop из `frmStructNar` или из грида того же наряда |
| `trGrdNarDragDrop` | `OnDragDrop` | перемещение / вставка раздела (см. ниже) |
| `ActionList1Update` | `OnUpdate` | правила `Enabled` (§5) |

### `trGrdNarCellValChange` — ввод факта и правила корреляции

Ключевая логика формы:

1. Если `locked = '1'` — выход (факт заблокированной работы не меняется).
2. `qrfactkorr` по `operlifeid`.
3. **Правил нет** (`eof`) → `aChangeCell.Value := newVal`, `SaveFact(CurNode)`, пересчёт итогов, `fBell := False`, выход.
4. **Правила есть** — собираются входные переменные Паскаль-скрипта:
   - `oldnorma` = `n2` (для констант `operlifetype = 78` берётся `n1`, «по логике изначально они равны»), приводится к виду `fNFormat` с точкой;
   - `oldfact` = текущий `Fact`;
   - `newfact` = вводимое значение.
5. Из `burnar.factkorr` берутся тексты `norma` и `fact` — расчётная логика.
6. Скрипты: `FactScript := oldnormaInit + oldfactInit + newfactInit + logicfact` (аналогично `NormScript`).
7. `TPasCalc.Execute` для каждого; при `ErrCode <> 0` — `ErrMsg` / `ErrLine` в `algInfo` и выход. Результат берётся из переменной `result` и пишется в `Fact` / `n2`.
8. `fBell := True`; `SaveNormaAndFact(CurNode)`; пересчёт итогов `n2` и `fact`.

### `tbCalcOperClick` — расчёт нормы

Как в задании, но через `burnar.VIPOLNENIE_REBUILD_OPER` и `burnar.VIPOLNENIE_CALC_OPERP`.
Дополнительно: если после расчёта `normaob` не пуст и в строке есть факт — повторно вызывается
`trGrdNarCellValChange(ByFieldName['fact'], ...)`, чтобы применить правила корреляции к новой
норме. Пересчёт дат — `CALL burnar.SetNextDateOperVIP(key, narkey)` → `qrSetNextDateOperVIP`
(`burnar.tkeydate` по `narkey` + `os_user`) → `UpdateTree(['begoperdate'])` → `DELETE FROM burnar.tkeydate`.

### `tbCloseNarZadClick` — закрытие выполнения

Подтверждение → `IsUnLocked`. Если есть хоть одна незаблокированная работа — сообщение
`MsgNotAllLocked` и отказ. Иначе `update burnar.defnarvip set closed = 1 where narkey = ...`,
`lclosed := True`. В отличие от задания серверная процедура не используется.

### `trGrdNarDragDrop`

- **`MoveOper <> nil`**: проверки «наряд закрыт», «между разными нарядами запрещено», «перемещаемая работа заблокирована» (`MsgCutLockedOper`), «вставка перед заблокированной запрещена» (`MsgCutBetLockedOper`) → `burnar.VIPOLNENIE_OPERAC_MOVE(...)`; диалог «внутрь блока / перед блоком» для пустого блока.
- **иначе** (drop из `formStructNur`): проверка «целевая работа заблокирована» → `burnar.vipolnenie_add_razdel(nkey, datein, aparent, aprnum, razdel, who, withname = 1)` с `razdel = SrcNode.Cells['Код раздела']`.

Далее `ReloadTekNar` + `Locate('key', loc)`.

### `actSelPeriodOperExecute` — привязка к периоду

Инвертированная относительно остальных проверка: если среди выделенных есть **не**заблокированная
работа (`locked = '0'`) — снять выделения и показать `MsgNotAllLocked`. Иначе `TfrmSetPeriod.loadcombo(keynar)`;
если периоды есть — по `mrOk` формируется один пакетный `update burnar.vipolnenie_oper set PERIOD = ...`
на все выделенные и обновляется поле `period_nm`.

### `ActSetDExecute` / `ActSetNotDExecute` — признак «Д»

Для каждой выделенной строки:

```sql
update burnar.vipolnenie_oper set priznak = 1 where key in (
  WITH RECURSIVE TMP AS (
    select t.key from burnar.vipolnenie_oper t where t.key = <key>
    union all
    select t.key from burnar.vipolnenie_oper t, tmp where tmp.key = t.parent
  ) select tmp.key from tmp )
```

то есть признак ставится/снимается на всё поддерево. Затем `tbReloadNarClick`.

---

## 7. Внешние зависимости

### Другие формы

| Модуль | Класс | Роль |
|--------|-------|------|
| `MainUnit` | `TfrmMain` | соединение, `Org`, `ImageList1`, `qrNarVipAllRes`, `MDIChildren` |
| `CommonNarZadUnit` | `TfrmComNarZad` | обновляется из `ToolButton23Click` |
| `formSkvVipVar` | `TfrmSkvVipVar` | сквозные параметры выполнения |
| `formStructNur` | `TfrmStructNar` | источник drag-and-drop |
| `formListPeriod` | `TfrmListPeriod` | список/правка периодов; форме передаётся `aorauser` и `loadlistperiod(keynar, lclosed)` |
| `formSetPeriod` | `TfrmSetPeriod` | выбор периода (`loadcombo(keynar)`) |
| `formMehBurIntervals` | `TfrmMehBurIntervals` | интервалы мех. бурения (`loadlistIntervals(keynar)`) |
| `formSetDate` | `TfrmSetBegDateOp` | ручной ввод даты/времени начала работы |
| `formSetWorker` | `TfrmSetWorker` | выбор исполнителя |
| `NarVipResUnit` | `TfrmNarVipRes` | наряд-выполнение по исполнителю |
| `pascalc` / `pasfunc` | `TPasCalc`, `TVar` | интерпретатор правил корреляции — **модулей нет в репозитории** |
| `UnitFormExplore` | `TFormExplore` | HTML-оперкарта — **модуля нет в репозитории** |

### Библиотеки и include-файлы

`OvniGrids` / `OVNIDbControls` (то же API, что у задания, плюс `CellEditorEx`, `CellValChange`,
`EditedFields`, `SetDataTypes`), `PgAccess` / `DBAccess` / `MemDS`, `Provider` / `DBClient`.

`{$I ProjectConst.INC}`, `{$I ProjectStr.INC}` — отсутствуют; из них берутся `FrmExtUserRes`,
`MsgAttentionRu`, `MsgChangeSavedRu`, `MsgDelBlock`, `MsgQuestionPodtverdit`,
`MsgDelLockedOper`, `MsgCutLockedOper`, `MsgCutBetLockedOper`, `MsgNotAllLocked`,
`MsgZadaniCopyToVipolnenie`.

---

## 8. Что учесть при переносе на веб

1. **`TPasCalc` — интерпретатор в клиенте.** Правила корреляции хранятся в БД как **тексты
   Паскаль-выражений** (`burnar.factkorr.norma` / `.fact`) и исполняются на стороне Delphi.
   На вебе исполнение произвольного кода из БД в браузере недопустимо: логику надо либо
   перенести в серверную процедуру, либо описать правила декларативно (набор операций вместо
   произвольного скрипта). Это самое рискованное место миграции.
2. **Двойной путь сохранения факта.** Есть правило корреляции → `SaveNormaAndFact`
   (`fact` + `norma` при `prnum = 1` и `2`); нет правила → `SaveFact` (только `fact`, **без
   фильтра по `prnum`** — обновляются все строки нормы узла). Расхождение стоит устранить
   осознанно, а не воспроизводить.
3. **Модель блокировок — центральная бизнес-логика.** `locked = '1'` запрещает изменение факта,
   вырезание, удаление, перемещение, вставку перед строкой и правку параметров; закрыть наряд
   можно только когда заблокировано **всё**; привязать к периоду — только заблокированные;
   импорт из задания — только когда заблокированных нет. Правила разбросаны по обработчикам —
   на вебе их лучше собрать в один сервис-guard (ср. существующий `NaryadMasterGuard`).
4. **Прямой SQL из UI со конкатенацией**: `colorsel`, `tipbur`, `PERIOD`, `priznak`, `sel`,
   `BEGOPERDATE`/`EDITDATE`, `vipolnenie_anynm.nm`, `vipolnenie_param.znach`,
   `vipolnenie_norm.norma`/`fact`, `defnarvip.closed`, `CALL Copy_Vip_to_Zad`.
5. **`burnar.narvip` вместо `burnar.vipolnenie_oper`** в `SetWorker` и `actSaveSelElemsExecute`
   (поля `whowork`, `sel`), и в `MainUnit.qrNarVipAllRes`. Надо проверить, что это за таблица.
6. **`burnar.tkeydate` и `os_user`** — та же проблема, что в задании: временные данные,
   разделяемые по имени ОС-пользователя, несовместимы с пулом соединений.
7. **Разбор ошибок сервера строкой.** `actLockOperExecute`, `tbCloseNarZadClick` вырезают
   фрагмент между `*` и `#` из текста исключения и кладут его в `sEdit1.Text`, плюс
   `frmMain.Get_ORA_Exception`. Это негласный контракт с процедурами БД: сообщение содержит
   маркеры. Для веба нужен нормальный код ошибки.
8. **Признак «Д» в тексте номера.** `priznak = 1` дописывает букву «Д» прямо в поле `ord`
   в SQL. На вебе это отдельный флаг колонки, а не часть строки.
9. **Панель итогов `qrITOGtable`** содержит захардкоженные `PARCODE = 2683` и `REPID = 1`
   (`burnar.ZNREPPARSV`) и список `OPERLIFETYPEOPER not in (200, 207, 208, 209)` плюс
   коэффициент `0.053`. Все эти константы надо вынести в конфигурацию/справочник.
   Два обработчика (`N1Click` и `SpeedButton2Click`) дают **разные наборы заголовков** для
   одного и того же набора данных — с вахтовыми колонками и без.
10. **`ToolButton23` (замена задания выполнением)** видна только при `frmMain.Org ∈ {1, 8}` —
    правило доступа по орг. единице, зашитое в код.
11. **Мёртвый код**: `LoadSavedNorms`, `SetSaveSel`, `SetVal`, `actSaveFact`, `actSetFactMoment`,
    `qrNormAtribName`, `qrCalcNorma1`, `qrColNotLocked`, `sAddRab`, `sClcBegDateNextOp`,
    `sMoveRab`, `sORDERNAR`, `sCopyOper`, `sZadanie_Calc_OperP` (объявлен, но выполнение
    считает через `SVIPOLNENIE_CALC_OPERP`).
12. **`actImportRabZad` защищён «костылём»** `if trGrdNar.Items.AllNodeCount > 0 then exit` —
    импорт возможен только в пустое выполнение. Ограничение надо перенести явно (проверка на
    сервере), а не полагаться на состояние грида.
