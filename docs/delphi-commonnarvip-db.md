# CommonNarVipUnit — объекты БД

Что нужно в базе для формы наряда-выполнения. Форма описана в
[delphi-commonnarvip-form.md](./delphi-commonnarvip-form.md). Многие справочники общие с
заданием — см. [delphi-commonnarzad-db.md](./delphi-commonnarzad-db.md).

Столбец **«В bd_bur»** сверен с репозиторием `bd_bur` (ветка `main`, 32 файла):

| Значение | Смысл |
|----------|-------|
| **есть** | DDL/тело объекта лежит в `bd_bur` |
| **нет** | объект нужен форме, но DDL в `bd_bur` отсутствует |
| **нет (мёртвый код)** | объекта нет и он не нужен: используется только в неисполняемых ветках |

---

## 1. Модель данных

```text
burnar.defnar                          общий описатель наряда
  └─ burnar.defnarvip (narkey PK)      фактическая часть: begdate/enddate/closed/closeddate

burnar.vipolnenie_oper                 ДЕРЕВО РАБОТ ВЫПОЛНЕНИЯ
  key PK, parent → vipolnenie_oper.key, prnum, narkey → defnarvip.narkey,
  oper → public.spr_oper.key, razdel → public.tematic_razdel.id,
  operlifeid → public.operlife.id, operlifetype, operlifetypeoper,
  begoperdate, editdate, colorsel, locked, priznak, sel,
  period → burnar.vipolnenie_period.key, tipbur → burnar.spr_eks.id, whowork
  ├─ burnar.vipolnenie_anynm  (vip_key, nm)                    имя блока
  ├─ burnar.vipolnenie_norm   (vip_key, prnum, norma, fact)    prnum=1 на ед., prnum=2 на объём + ФАКТ
  ├─ burnar.vipolnenie_param  (vip_key, parcode, znach)        значения параметров
  ├─ burnar.vipolnenie_ist    (vip_key, ist)                   источники нормирования
  └─ burnar.vipolnenie_stroka                                  (упоминается в vipolnenie_add_razdel)

burnar.vipolnenie_period (key, nm, begoperdate, outoperdate, narkey, user_id)
  └─ burnar.ZNREPPARSV (period_key, parcode, repid, val)       значения параметров отчёта по периоду

burnar.factkorr (idlife, norma, fact)   ПРАВИЛА КОРРЕЛЯЦИИ: тексты Паскаль-выражений
burnar.zndefnarvipatrib (defnar, parcode, val, znval)  сквозные параметры выполнения
burnar.ot_params / burnar.do_params     списки parcode «интервал от» / «до»
burnar.tkeydate (key, narkey, begoperdate, os_user)    буфер пересчитанных дат
burnar.spr_eks (id, parent_id, name, name_short)       справочник ЭКС
```

---

## 2. Таблицы схемы `burnar`

| Объект | Назначение | Как используется формой | В bd_bur |
|--------|-----------|--------------------------|----------|
| `burnar.vipolnenie_oper` | дерево работ наряда-выполнения | `qrNarVip` (рекурсивный CTE); `qrLocked`/`qrUnLock` (`count(*)` по `locked`); прямые `update`: `colorsel`, `tipbur`, `PERIOD`, `priznak` (рекурсивным CTE по поддереву), `BEGOPERDATE` + `EDITDATE = 1` | **нет** |
| `burnar.vipolnenie_norm` | норма (минуты) **и факт** | `qrNarVip` (`round(norma/60, 2)` для `prnum = 1`/`2`, `round(fact/60, 2)` для `prnum = 2`); `SaveNormaAndFact` и `SaveFact` пишут `fact`/`norma` (делят на `kf`); `qrITOGtable` суммирует по `prnum = 2` | **нет** |
| `burnar.vipolnenie_param` | значения параметров операции | `qrParamV`, `qrNarVip` (интервалы от/до); `update ... set znach` в `cbParValuesExit` | **нет** |
| `burnar.vipolnenie_ist` | источники нормирования по строке | `qrHtmlOk`; `delete ... where vip_key = ...` при смене параметра | **нет** |
| `burnar.vipolnenie_anynm` | название блока | подзапрос в `qrNarVip`; `update ... set nm` в `actRenameBlock` | **нет** |
| `burnar.vipolnenie_stroka` | строки расчёта нормы | наполняется `vipolnenie_add_razdel` | **нет** |
| `burnar.vipolnenie_period` | периоды выполнения работ | `qrNarVip` (`period_nm` = `nm (dd.mm.yyyy - dd.mm.yyyy)`); `qrITOGtable` (LEFT JOIN); правится формой `formListPeriod` | **есть** (`vipolnenie_period.txt` + 3 триггера) |
| `burnar.defnarvip` | описатель фактической части | `qrClosed` (`select closed`); `update ... set closed = 1` в `actCloseNarVip`; `closed = 0` в `actOpenNarVip` | **есть** (`defnarvip.txt` + 2 триггера) |
| `burnar.defnar` | общий описатель наряда | косвенно | **есть** (`defnar.txt`) |
| `burnar.factkorr` | **правила корреляции факт↔норма**: `idlife` → `operlifeid`, поля `norma` и `fact` содержат текст Паскаль-выражений с переменными `oldnorma`, `oldfact`, `newfact`, `result` | `qrfactkorr` (при каждом вводе факта); `qrNarVip` — признак `kor` (есть ли правило) | **нет** |
| `burnar.zndefnarvipatrib` | сквозные параметры выполнения | `qrParamV` — признак `isSkv` (коды цветов `14811101` / `11777023`) | **нет** |
| `burnar.ZNREPPARSV` | значения параметров отчётности по периоду (`period_key`, `parcode`, `repid`, `val`) | `qrITOGtable` — «Ремонт Н.В.» / «Ремонт Факт.» при `parcode = 2683`, `repid = 1` | **нет** |
| `burnar.ot_params`, `burnar.do_params` | наборы `parcode` для интервалов | `qrNarVip` | **нет** |
| `burnar.tkeydate` | буфер пересчитанных дат, разделяется по `os_user` | `qrSetNextDateOperVIP` + `DELETE` | **нет** |
| `burnar.spr_eks` | справочник ЭКС | `qrEKS` (CTE от `parent_id = 1`); `name_short` в `qrNarVip` | **нет** |
| `burnar.narvip` | **под вопросом**: `SetWorker` пишет `update burnar.narvip set whowork`, `actSaveSelElems` — `set sel`, `MainUnit.qrNarVipAllRes` читает `distinct whowork`; остальные запросы работают с `vipolnenie_oper` | `SetWorker`, `actSaveSelElems` | **нет** |
| `burnar.spr_workers` | исполнители (`key` → `org`) | `MainUnit.qrNarVipAllRes` для `actNarToRes` | **есть** (`spr_workrers.txt`) |
| `burnar.org_stru` | орг. структура | `MainUnit.qrNarVipAllRes` — имя исполнителя как путь по дереву | **есть** (`org_stru_bur`) |
| `burnar.calcnormvip` | старая схема векторов норм | `qrAllSavedNorms` | **нет (мёртвый код)** |
| `burnar.valnormvipfact` | значения компонент нормы + факт | `qrAllSavedNorms` | **нет (мёртвый код)** |
| `burnar.cfg_izmer`, `burnar.spr_edizm` | конфигурация измерителя | `qrNormAtribName` (здесь со схемой `burnar`, в задании — без схемы) | **нет (мёртвый код)** |
| `burnar.sprnartype` | тип наряда → измеритель | `MainUnit.qrIzmer` | **есть** (`sprnartype.txt`) |

---

## 3. Таблицы схемы `public`

Полностью совпадают с наряд-заданием (см. [delphi-commonnarzad-db.md §3](./delphi-commonnarzad-db.md)):

| Объект | Где в этой форме | В bd_bur |
|--------|------------------|----------|
| `public.spr_oper` | `qrNarVip` — имя работы | **есть** |
| `public.common_spr` | `qrParamV` — расчёт `isSkv` | **есть** |
| `public.tematic_razdel` | параметр `razdel` в `vipolnenie_add_razdel` | **есть** |
| `public.user_param` | `qrParamV` — имя, `type`, `edizm` параметра | **нет** |
| `public.spr_edizm` | `qrParamV` — единица измерения параметра | **нет** |
| `public.zn_dparam` | `qrAllZnTekDiscrParam`, `qrParamV` — значения дискретных параметров | **нет** |
| `public.operlife` | `qrAlgInfo`, `qrHtmlOk` (`osnoventer1`) | **нет** |
| `public.comboperparam` | `qrParamV` — порядок параметров комбинации | **нет** |
| `public.alg_operlife`, `public.algs`, `public.algzndparam`, `public.alguserparam` | `qrAlgInfo`, `qrAllZnTekDiscrParam`, `qrParamV` | **нет** |
| `public.norms`, `public.sbor_norm` | `qrAllZnTekDiscrParam` | **нет** |
| `public.istochniki` | `qrHtmlOk` — `lnkfile` HTML-оперкарты | **нет** |
| `public.spr_izmer`, `public.cfg_izmer`, `public.oper_izmer`, `public.all_norms`, `public.normist`, `public.normstr`, `public.tech_proc_cfg` | внутри `vipolnenie_add_razdel` / `vipolnenie_add_emp_razdel` | **нет** |

> В `qrHtmlOk` выполнения таблицы `operlife` и `istochniki` указаны **без схемы**, в задании — как
> `public.operlife` / `public.istochniki`. Расхождение стилевое, но при жёстком `search_path` может
> сломаться.

---

## 4. Функции

| Функция | Назначение | Где | В bd_bur |
|---------|-----------|-----|----------|
| `burnar.vipolnenie_GetOperIst(key)` | строка источников нормирования для строки выполнения | `qrNarVip` | **нет** |
| `burnar.getdolgn(...)` | должность пользователя | `vipolnenie_add_razdel` | **есть** (`functions/getdolgn`) |
| `burnar.seq_return(...)` | следующее значение последовательности | `vipolnenie_add_razdel` | **нет** |
| `getallpervip` | все периоды выполнения строкой | в форме не используется; полезна для UI периодов | **тело есть**, заголовка `CREATE FUNCTION` нет (`getallpervip.txt`) |
| `getmasters` | мастера через дефис | в форме не используется | **тело есть**, заголовка нет (`getmasters.txt`) |
| `burnar.getnarvip(keynar, izmer, deepLev)` | табличный обход дерева выполнения | `qrAllSavedNorms` | **нет (мёртвый код)** |
| `burnar.CalcOpV(aKey, aId, aParent, aNumin, aIzmer)` | расчёт нормы, старый табличный интерфейс | `qrCalcNorma1` | **нет (мёртвый код)** |
| `GetZRazdelStat(key)` | статус раздела; **закомментирована** в `qrNarVip`, заменена массивом `13555..13566` | `qrNarVip` | **нет** |

---

## 5. Процедуры

### Вызываются формой

| Процедура | Параметры | Что делает | Триггер в UI | В bd_bur |
|-----------|-----------|------------|--------------|----------|
| `burnar.vipolnenie_add_razdel` | `nkey int, datein timestamp, aparent bigint, aprnum numeric, razdel numeric, who int, withname numeric` | вставка тематического раздела/операции в выполнение | drop из `formStructNur` | **есть** (`procedures/vipolnenie_add_razdel.txt`, 607 стр.) |
| `burnar.VIPOLNENIE_ADD_EMPTYBLOCK` | `nkey int, datein timestamp, aparent bigint, aprnum numeric, textik varchar, who int` | добавление пустого блока | `actVipolnenie_add_emptyblock` | **нет** |
| `burnar.VIPOLNENIE_OPERAC_DEL` | `akey bigint, aparent bigint, aprnum numeric, anarkey int` | удаление работы | `actDelSelOpers` | **нет** |
| `burnar.VIPOLNENIE_OPERAC_DEL_BLOCK` | `akey bigint, aparent bigint, aprnum numeric, anarkey int` | удаление блока без удаления вложенных работ | `actVipolnenie_del_block` | **нет** |
| `burnar.VIPOLNENIE_OPERAC_COPY` | `key_oper bigint, parent_oper bigint, aparent_where_copy bigint, aprnum_where_copy numeric, anarkey int` | копирование работы/поддерева | `actPasteRab` при `edcopy` | **нет** |
| `burnar.VIPOLNENIE_OPERAC_MOVE` | `akey bigint, aparent bigint, aprnum numeric, newparent bigint, newprnum numeric, anarkey int` | перемещение работы/поддерева | drag-and-drop, `actPasteRab` при `edcut` | **нет** |
| `burnar.VIPOLNENIE_RENUMLEVEL` | `aparent bigint, anarkey int` | перенумерация `prnum` внутри уровня | `actReOrderRab` | **нет** |
| `burnar.VIPOLNENIE_CALC_OPERP` | `akey bigint, aoperlifeid int, aizmer inout, normaed inout, normaob inout, istochniki inout varchar, aot inout, ado inout` | расчёт нормы по параметрам | `actCalcOperAndSaveRes` | **нет** |
| `burnar.VIPOLNENIE_REBUILD_OPER` | `akey bigint, anarkey int, aisrebuild inout` | проверка/перестройка структуры операции | `actCalcOperAndSaveRes`, шаг 1 | **нет** |
| `burnar.VIPOLNENIE_LOCK_OPER` | `akey bigint, anarkey int` | блокировка работы (`locked = 1`); при отказе возвращает исключение с маркерами `*` и `#` в тексте | `actLockOper` | **нет** |
| `burnar.VIPOLNENIE_UN_LOCK_OPER` | `akey bigint, anarkey int` | разблокировка работы | `actUnLockOper` | **нет** |
| `burnar.ZADANIE_TO_VIPOLNENIE` | `nkey int, datein date` | перенос всех работ из задания в выполнение | `actImportRabZad` | **нет** |
| `burnar.SetNextDateOperVIP` | `key, narkey` (вызов строкой `CALL ...`) | пересчёт дат начала последующих работ → `burnar.tkeydate` | `actCalcOperAndSaveRes`, шаг 4 | **нет** |
| `burnar.Copy_Vip_to_Zad` | `nkey int` (именованный вызов `nkey => ...`) | замена наряда-задания наряд-выполнением | `ToolButton23Click`, только при `frmMain.Org ∈ {1, 8}` | **нет** |

### Объявлены в `.dfm`, но не вызываются

| Процедура | Комментарий | В bd_bur |
|-----------|-------------|----------|
| `BURNAR.ADDONEOPERINNARVIP(NKEY, OPERKEY, DATEIN, APRNUM, RAZDEL, WHO, out NARVIPKEY)` | `sAddRab` | **нет (мёртвый код)** |
| `BURNAR.CALCBEGDATENEXTOPVIP(AOPNARKEY, ATIMENORMA, ARES, out AOPCHANGED, out ANEXTDATE)` | `sClcBegDateNextOp` — заменён на `SetNextDateOperVIP` + `tkeydate` | **нет (мёртвый код)** |
| `BURNAR.MOVEOPVIP(AKEY, TOPRNUM)` | `sMoveRab` — заменён на `VIPOLNENIE_OPERAC_MOVE` | **нет (мёртвый код)** |
| `BURNAR.COPYOPVIP(ASRCKEY, TOPRNUM)` | `sCopyOper` — заменён на `VIPOLNENIE_OPERAC_COPY` | **нет (мёртвый код)** |
| `BURNAR.REORDERNAR_ZADVIP(ANARKEY, ATIPNAR)` | `sORDERNAR` — заменён на `VIPOLNENIE_RENUMLEVEL` | **нет (мёртвый код)** |
| `BURNAR.Zadanie_Calc_OperP(...)` | `sZadanie_Calc_OperP` — объявлен, но выполнение считает через `VIPOLNENIE_CALC_OPERP` | нужен **заданию**, здесь мёртв |

В `bd_bur` также есть `procedures/vipolnenie_add_emp_razdel` (216 стр.) — вставка «пустого»
раздела; форма её не вызывает (использует `formStructNur`).

---

## 6. Триггеры

| Триггер | Таблица | В bd_bur |
|---------|---------|----------|
| `trg_defnarvip_ins_after` → `burnar.ftrg_defnarvip_ins_after()` | `burnar.defnarvip` (AFTER INSERT) | DDL **есть**, тело функции — **нет** |
| `trg_defnarvip_upd` → `burnar.ftrg_defnarvip_upd()` | `burnar.defnarvip` (BEFORE UPDATE) | DDL **есть**, тело — **нет** |
| `trg_vip_period_ins_before` → `burnar.ftrg_vip_period_ins_before()` | `burnar.vipolnenie_period` | DDL **есть**, тело — **нет** |
| `trg_vip_period_ins_after` → `burnar.ftrg_vip_period_ins_after()` | `burnar.vipolnenie_period` | DDL **есть**, тело — **нет** |
| `trg_vip_period_del_after` → `burnar.ftrg_vip_period_del_after()` | `burnar.vipolnenie_period` | DDL **есть**, тело — **нет** |

`trg_defnarvip_ins_after` важен: `VIPOLNENIE_CREATE` вставляет строку в `defnarvip`, а триггер,
судя по имени, доделывает создание выполнения. Без тела функции поведение неизвестно.
Триггеры на `vipolnenie_oper` / `vipolnenie_norm` / `vipolnenie_param` в репозитории отсутствуют.

---

## 7. Что уже есть в bd_bur

Из объектов, нужных именно этой форме:

| Файл | Объект |
|------|--------|
| `defnarvip.txt` | `burnar.defnarvip` + `trg_defnarvip_ins_after`, `trg_defnarvip_upd` |
| `vipolnenie_period.txt` | `burnar.vipolnenie_period` + 3 триггера, FK на `burnar.users` |
| `defnar.txt` | `burnar.defnar` + 4 триггера |
| `sprnartype.txt` | `burnar.sprnartype` |
| `spr_oper.txt` | `public.spr_oper` |
| `public_common_spr.txt` | `public.common_spr` |
| `tematic_razdel.txt` | `public.tematic_razdel` |
| `spr_workrers.txt`, `org_stru_bur` | исполнители и орг. структура для `actNarToRes` |
| `users_bur` | `burnar.users` (FK из `vipolnenie_period.user_id`) |
| `procedures/vipolnenie_add_razdel.txt`, `procedures/vipolnenie_add_emp_razdel` | вставка разделов |
| `getallpervip.txt` | тело функции «все периоды выполнения» (без заголовка) |
| `znparams.txt` | `burnar.znparams` — **не** `zndefnarvipatrib` |

---

## 8. Что нужно добавить в bd_bur

### Таблицы

- [ ] `burnar.vipolnenie_oper` (ядро дерева работ)
- [ ] `burnar.vipolnenie_norm` (норма + факт)
- [ ] `burnar.vipolnenie_param`
- [ ] `burnar.vipolnenie_ist`
- [ ] `burnar.vipolnenie_anynm`
- [ ] `burnar.vipolnenie_stroka`
- [ ] `burnar.factkorr` — **приоритет**: без неё не воспроизвести ввод факта
- [ ] `burnar.zndefnarvipatrib`
- [ ] `burnar.ZNREPPARSV` — нужна для панели итогов
- [ ] `burnar.ot_params`, `burnar.do_params`
- [ ] `burnar.tkeydate`
- [ ] `burnar.spr_eks`
- [ ] `public.user_param`, `public.spr_edizm`, `public.zn_dparam`
- [ ] `public.operlife`, `public.comboperparam`, `public.alg_operlife`, `public.algs`, `public.algzndparam`, `public.alguserparam`
- [ ] `public.norms`, `public.sbor_norm`, `public.all_norms`, `public.normist`, `public.normstr`
- [ ] `public.istochniki`
- [ ] `public.spr_izmer`, `public.cfg_izmer`, `public.oper_izmer`, `public.tech_proc_cfg`
- [ ] уточнить `burnar.narvip` (поля `whowork`, `sel`)

### Функции

- [ ] `burnar.vipolnenie_GetOperIst(key)`
- [ ] `burnar.seq_return(...)`
- [ ] заголовки `CREATE FUNCTION` для `getallpervip`, `getmasters`
- [ ] тела триггерных функций `ftrg_defnarvip_ins_after`, `ftrg_defnarvip_upd`, `ftrg_vip_period_ins_before`, `ftrg_vip_period_ins_after`, `ftrg_vip_period_del_after`

### Процедуры

- [ ] `burnar.VIPOLNENIE_ADD_EMPTYBLOCK`
- [ ] `burnar.VIPOLNENIE_OPERAC_DEL`
- [ ] `burnar.VIPOLNENIE_OPERAC_DEL_BLOCK`
- [ ] `burnar.VIPOLNENIE_OPERAC_COPY`
- [ ] `burnar.VIPOLNENIE_OPERAC_MOVE`
- [ ] `burnar.VIPOLNENIE_RENUMLEVEL`
- [ ] `burnar.VIPOLNENIE_CALC_OPERP`
- [ ] `burnar.VIPOLNENIE_REBUILD_OPER`
- [ ] `burnar.VIPOLNENIE_LOCK_OPER`
- [ ] `burnar.VIPOLNENIE_UN_LOCK_OPER`
- [ ] `burnar.ZADANIE_TO_VIPOLNENIE`
- [ ] `burnar.SetNextDateOperVIP`
- [ ] `burnar.Copy_Vip_to_Zad`
- [ ] `burnar.VIPOLNENIE_CREATE` (вызывается из задания, но создаёт объекты выполнения)

### Можно не добавлять (мёртвый код формы)

`burnar.getnarvip`, `burnar.CalcOpV`, `burnar.calcnormvip`, `burnar.valnormvipfact`,
`BURNAR.ADDONEOPERINNARVIP`, `BURNAR.CALCBEGDATENEXTOPVIP`, `BURNAR.MOVEOPVIP`,
`BURNAR.COPYOPVIP`, `BURNAR.REORDERNAR_ZADVIP`, `GetZRazdelStat`.

---

## 9. Замечания к схеме

1. **`burnar.factkorr` — это исполняемый код в данных.** Поля `norma` и `fact` содержат текст
   Паскаль-выражений, который Delphi исполняет через `TPasCalc` с предустановленными переменными
   `oldnorma`, `oldfact`, `newfact` и результатом в `result`. При выгрузке таблицы обязательно
   сохранить **сами значения строк**, а не только DDL — иначе логику расчёта факта восстановить
   не получится. Для веба это надо либо перенести в серверную процедуру, либо описать
   декларативно.
2. **Норма и факт хранятся в минутах.** Чтение — `round(norma/60, 2)` и `round(fact/60, 2)`,
   запись — деление на `kf` из `MainUnit.SetMainCalcSetting`.
3. **`SaveFact` пишет `fact` без фильтра по `prnum`**, а `SaveNormaAndFact` — тоже без фильтра
   для `fact`, но с `prnum = 1`/`2` для `norma`. При этом читается только `prnum = 2`. Похоже на
   ошибку; при переносе решить осознанно.
4. **Панель итогов (`qrITOGtable`) содержит захардкоженную бизнес-логику**:
   `burnar.ZNREPPARSV.PARCODE = 2683`, `REPID = 1`, исключение
   `OPERLIFETYPEOPER not in (200, 207, 208, 209)` и коэффициент `0.053`. Правило по факту такое:
   `REMONT_N = min(ZNREPPARSV.VAL, 0.053 * сумма норматива)`, то есть плановый ремонт из
   `ZNREPPARSV` **срезается** до 5.3 % от норматива по периоду. Всё это надо вынести в
   справочник/конфигурацию.
   Отдельно: колонка `OPERLIFETYPEOPER` в `vipolnenie_oper` больше нигде в форме не встречается.
5. **`priznak`** («Д») меняется рекурсивным CTE на всё поддерево и попадает в отображаемый
   номер строки (`ord`) прямо в SQL `qrNarVip`.
6. **`EDITDATE = 1`** отмечает вручную выставленную фактическую дату; поле нигде не читается
   формой — только пишется. Проверить, кто его использует (вероятно, `SetNextDateOperVIP`,
   чтобы не перезатирать ручные даты).
7. **`locked`** — числовое поле, но форма сравнивает его как строку (`'1'` / `'0'`) после
   загрузки в грид; `qrLocked` / `qrUnLock` считают `count(*) ... where o.locked = 1`.
   Разблокированное состояние — именно `0`, не `NULL`: `actLockOper.Enabled` требует
   `locked = '0'`, поэтому `NULL` заблокирует кнопку. Значит нужен `NOT NULL DEFAULT 0`.
8. **`burnar.tkeydate` и `os_user`** — как в задании: несовместимо с пулом соединений.
9. **Контракт по ошибкам.** `VIPOLNENIE_LOCK_OPER` (и, вероятно, `ZADANIE_CLOSENAR`) возвращают
   сообщение об ошибке с маркерами `*` и `#`: форма вырезает фрагмент между ними и показывает
   пользователю. При переписывании процедур этот формат надо либо сохранить, либо согласованно
   заменить на код ошибки + структурированное сообщение.
10. **`aparent`/`akey` в процедурах выполнения — `bigint`**, тогда как в аналогичных процедурах
    задания — `integer`. Расхождение типов между парными процедурами; учесть в DTO.
