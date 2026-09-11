# CommonNarZadUnit — объекты БД

Что нужно в базе для формы наряда-задания. Форма описана в
[delphi-commonnarzad-form.md](./delphi-commonnarzad-form.md).

Столбец **«В bd_bur»** сверен с репозиторием `bd_bur` (ветка `main`, 32 файла):

| Значение | Смысл |
|----------|-------|
| **есть** | DDL/тело объекта лежит в `bd_bur` |
| **нет** | объект нужен форме, но DDL в `bd_bur` отсутствует |
| **нет (мёртвый код)** | объекта нет и он не нужен: используется только в неисполняемых ветках |

Схема по умолчанию у объектов без префикса — `public` (в Delphi часть запросов написана без
схемы и опирается на `search_path`).

---

## 1. Модель данных

```text
burnar.defnar                         описатель наряда (общий)
  ├─ burnar.defnarzad (narkey PK)     плановая часть: begdate/enddate/closed/closeddate
  └─ burnar.defnarvip (narkey PK)     фактическая часть (создаётся VIPOLNENIE_CREATE)

burnar.zadanie_oper                   ДЕРЕВО РАБОТ ЗАДАНИЯ
  key PK, parent → zadanie_oper.key, prnum, narkey → defnarzad.narkey,
  oper → public.spr_oper.key, razdel → public.tematic_razdel.id,
  operlifeid → public.operlife.id, operlifetype, begoperdate,
  colorsel, locked, tipbur → burnar.spr_eks.id, whowork
  ├─ burnar.zadanie_anynm  (zad_key, nm)                 имя блока, когда oper IS NULL
  ├─ burnar.zadanie_norm   (zad_key, prnum, norma)       prnum=1 — на ед. изм., prnum=2 — на объём
  ├─ burnar.zadanie_param  (zad_key, parcode, znach)     значения параметров операции
  ├─ burnar.zadanie_ist    (zad_key, ist)                источники нормирования
  └─ burnar.zadanie_stroka                               (упоминается в zadanie_add_razdel)

burnar.zndefnarzadatrib (defnar, parcode, val, znval)    сквозные параметры задания
burnar.ot_params / burnar.do_params                      списки parcode «интервал от» / «до»
burnar.tkeydate (key, narkey, begoperdate, os_user)      буфер пересчитанных дат
burnar.spr_eks (id, parent_id, name, name_short)         справочник ЭКС
```

---

## 2. Таблицы схемы `burnar`

| Объект | Назначение | Как используется формой | В bd_bur |
|--------|-----------|--------------------------|----------|
| `burnar.zadanie_oper` | дерево работ наряда-задания | `qrNarZad` (рекурсивный CTE по `parent`); прямые `update` полей `colorsel` (`actSelelColorRow`, `actClearColor`) и `tipbur` (`DBLookupComboBox2Click`) | **нет** |
| `burnar.zadanie_anynm` | название блока/раздела (когда `oper IS NULL`) | подзапрос в `qrNarZad`; `update ... set nm` в `actRenameBlock` | **нет** |
| `burnar.zadanie_norm` | нормы времени, в минутах | `qrNarZad` (`round(norma/60, 2)` для `prnum = 1` и `2`); `update ... set norma = <знач>/<kf> ... and prnum = 2` в `cbNormEditExit`; `update ... set norma = null` при смене параметра | **нет** |
| `burnar.zadanie_param` | значения параметров операции | `qrParamZ`, `qrNarZad` (интервалы от/до); `update ... set znach` в `cbParValuesExit` | **нет** |
| `burnar.zadanie_ist` | источники нормирования по строке | `qrHtmlOk`; `delete ... where zad_key = ...` в `cbParValuesExit` | **нет** |
| `burnar.zadanie_stroka` | строки расчёта нормы | напрямую формой не читается, но её наполняет `zadanie_add_razdel` | **нет** |
| `burnar.defnarzad` | описатель плановой части наряда | `qrClosed` (`select closed`); `update ... set closed = 0` в `actOpenDefNar`; закрытие — через `ZADANIE_CLOSENAR` | **есть** (`defnarzad.txt`) |
| `burnar.defnar` | общий описатель наряда | косвенно, через `keynar` | **есть** (`defnar.txt`) |
| `burnar.zndefnarzadatrib` | сквозные (глобальные) параметры задания | `qrParamZ` — вычисление признака `isSkv` (совпадает ли значение параметра со сквозным): `14811101` / `11777023` — коды цветов | **нет** |
| `burnar.ot_params` | набор `parcode`, трактуемых как «интервал от» | `qrNarZad`: `parcode in (select * from burnar.ot_params)` | **нет** |
| `burnar.do_params` | то же для «интервал до» | `qrNarZad` | **нет** |
| `burnar.tkeydate` | буфер пересчитанных дат начала работ, разделяется по `os_user` | `qrSetNextDateOper` (`narkey` + `os_user = orauser`); `DELETE ... where os_user = ... and narkey = ...` после чтения | **нет** |
| `burnar.spr_eks` | справочник ЭКС (иерархия по `parent_id`) | `qrEKS` (рекурсивный CTE от `parent_id = 1`) для lookup-комбо; `name_short` в `qrNarZad` | **нет** |
| `burnar.narzad` | **под вопросом**: в `SetWorker` идёт `update burnar.narzad set whowork = ... where key = ...`, хотя все остальные запросы работают с `zadanie_oper` | `SetWorker` (кнопка скрыта: `tbSetWorker.Visible = False`) | **нет** |
| `burnar.calcnormzad` | старая схема хранения векторов норм | `qrAllSavedNorms` | **нет (мёртвый код)** |
| `burnar.valnormzad` | значения компонент вектора нормы | `qrAllSavedNorms` | **нет (мёртвый код)** |
| `burnar.cfg_izmer` | конфигурация измерителя | `qrNormAtribName` | **нет (мёртвый код)** |
| `burnar.sprnartype` | тип наряда → основной измеритель | не формой, а `MainUnit.qrIzmer` (даёт `izmer` в `OpenNar`) | **есть** (`sprnartype.txt`) |

---

## 3. Таблицы схемы `public`

| Объект | Назначение | Где используется | В bd_bur |
|--------|-----------|------------------|----------|
| `public.spr_oper` | справочник операций (`key`, `nm`) | `qrNarZad` — имя работы | **есть** (`spr_oper.txt`) |
| `public.common_spr` | общий справочник; `normparorzn` связывает параметр со сквозным значением | `qrParamZ` (расчёт `isSkv`) | **есть** (`public_common_spr.txt`) |
| `public.tematic_razdel` | тематические разделы — источник drag-and-drop | параметр `razdel` процедуры `zadanie_add_razdel` | **есть** (`tematic_razdel.txt`) |
| `public.user_param` | справочник параметров (`key`, `nm`, `type`, `edizm`); `type` = 1 непрерывный / 2 дискретный | `qrParamZ` | **нет** |
| `public.spr_edizm` | единицы измерения (`key`, `znach`, `ked`) | `qrParamZ`; `MainUnit` для расчёта `kf` | **нет** |
| `public.zn_dparam` | значения дискретных параметров (`key`, `dparam`, `znach`, `orderv`) | `qrAllZnTekDiscrParam`, `qrParamZ` | **нет** |
| `public.operlife` | «время жизни» операции; `osnoventer1` — основной источник, `findnormtype`, `typerab` | `qrAlgInfo`, `qrHtmlOk` | **нет** |
| `public.comboperparam` | параметры операции-комбинации (`operlifeid`, `prnum`, `param`) | `qrParamZ` — порядок параметров | **нет** |
| `public.alg_operlife` | связка алгоритм ↔ operlife (`id_operlife`, `alg`) | `qrAlgInfo`, `qrAllZnTekDiscrParam`, `qrParamZ` | **нет** |
| `public.algs` | алгоритмы (`key`, `ops` — текст) | `qrAlgInfo` → `algInfo: TMemo` | **нет** |
| `public.algzndparam` | допустимые значения дискретных параметров алгоритма (`alg`, `zndparam`) | `qrAllZnTekDiscrParam` | **нет** |
| `public.alguserparam` | пользовательские параметры алгоритма (`alg`, `userparam`, `prnum`) | `qrParamZ` | **нет** |
| `public.norms` | нормы (`key`, `operlifeid`) | `qrAllZnTekDiscrParam` | **нет** |
| `public.sbor_norm` | сборные нормы (`key_norm`, `zndparam`) | `qrAllZnTekDiscrParam` | **нет** |
| `public.istochniki` | источники нормирования (`id`, `lnkfile` — имя HTML-файла оперкарты) | `qrHtmlOk` | **нет** |
| `public.cfg_izmer` | атрибуты измерителя (`izmer`, `prnum`, `atribname`, `edizm`) | `qrNormAtribName` | **нет (мёртвый код)** |
| `public.spr_izmer` | справочник измерителей | `zadanie_add_razdel` (тип переменной `CodIzmer`) | **нет** |
| `public.oper_izmer`, `public.all_norms`, `public.normist`, `public.normstr`, `public.tech_proc_cfg` | используются внутри `zadanie_add_razdel` / `zadanie_add_emp_razdel` | косвенно | **нет** |

---

## 4. Функции

| Функция | Назначение | Где | В bd_bur |
|---------|-----------|-----|----------|
| `burnar.zadanie_GetOperIst(key)` | возвращает строку источников нормирования для строки наряда (колонка «Источник нормирования») | `qrNarZad` | **нет** |
| `burnar.getdolgn(...)` | должность пользователя | не формой, а процедурами `*_add_razdel` | **есть** (`functions/getdolgn`) |
| `burnar.seq_return(...)` | выдача следующего значения последовательности | внутри `zadanie_add_razdel` | **нет** |
| `burnar.getnarzad(keynar, izmer, deepLev)` | табличная функция обхода дерева задания | `qrAllSavedNorms` | **нет (мёртвый код)** |
| `burnar.zadanie_calc_oper(akey, aid, aizmer)` | расчёт нормы, старый интерфейс с возвратом таблицы | `qrCalcNorma1` | **нет (мёртвый код)** |
| `GetZRazdelStat(key)` | статус раздела; в `qrNarZad` **закомментирована** и заменена на захардкоженный массив `13555..13566` | `qrNarZad` | **нет** |
| `burnar.CheckNarParams(nkey)` | проверка параметров наряда | `MainUnit`, не формой | **нет** |
| `burnar.valid_user_f(user, pwd)` | проверка пользователя при логине | `MainUnit` | **нет** |

---

## 5. Процедуры

### Вызываются формой

| Процедура | Параметры | Что делает | Триггер в UI | В bd_bur |
|-----------|-----------|------------|--------------|----------|
| `burnar.zadanie_add_razdel` | `nkey int, datein timestamp, aparent int, aprnum numeric, razdel numeric, who int, withname numeric` | вставка тематического раздела/операции в задание | drop из `formStructNur` | **есть** (`procedures/zadanie_add_razdel.txt`, 592 стр.) |
| `burnar.ZADANIE_ADD_EMPTYBLOCK` | `nkey int, datein timestamp, aparent int, aprnum numeric, textik varchar, who int` | добавление пустого блока с именем | `actZadanie_add_emptyblock` | **нет** |
| `burnar.ZADANIE_OPERAC_DEL` | `akey int, aparent int, aprnum numeric, anarkey int` | удаление работы (с перенумерацией уровня) | `actDelSelOpers` | **нет** |
| `burnar.ZADANIE_OPERAC_DEL_BLOCK` | `akey int, aparent int, aprnum numeric, anarkey int` | удаление блока с подъёмом вложенных работ на уровень выше | `actZadanie_del_block` | **нет** |
| `burnar.Zadanie_operac_copy` | `key_oper int, parent_oper int, aparent_where_copy int, aprnum_where_copy numeric, anarkey int` | копирование работы/поддерева в указанное место | `actPasteRab` при `fEdAct = edcopy` | **нет** |
| `burnar.Zadanie_operac_move` | `akey int, aparent int, aprnum numeric, newparent int, newprnum numeric, anarkey int` | перемещение работы/поддерева | drag-and-drop, `actPasteRab` при `edcut` | **нет** |
| `burnar.ZADANIE_RENUMLEVEL` | `aparent int, anarkey int` | перенумерация `prnum` внутри уровня | `actReOrderRab` | **нет** |
| `burnar.ZADANIE_CALC_OPERP` | `akey int, aoperlifeid int, aizmer inout, normaed inout, normaob inout, istochniki inout varchar, aot inout, ado inout` | расчёт нормы по заданным параметрам; возвращает норму на ед./объём, строку источников и интервалы | `actCalcOperAndSaveRes` | **нет** |
| `burnar.ZADANIE_REBUILD_OPER` | `akey int, anarkey int, aisrebuild inout` | проверка/перестройка структуры операции; `aisrebuild = 1` → форма просит повторить расчёт | `actCalcOperAndSaveRes`, шаг 1 | **нет** |
| `burnar.ZADANIE_CLOSENAR` | `anarkey int` | закрытие наряда-задания от изменений | `actCloseNarZad` | **нет** |
| `burnar.SetNextDateOperZAD` | `key, narkey` (вызов строкой `CALL ...`) | пересчёт дат начала последующих работ, результат кладётся в `burnar.tkeydate` | `actCalcOperAndSaveRes`, шаг 4 | **нет** |
| `burnar.VIPOLNENIE_CREATE` | `anarkey int` | создание пустого наряда-выполнения (описатель + копия сквозных параметров задания) | `actCreateCopyNarVip` | **нет** |

### Объявлены в `.dfm`, но не вызываются

| Процедура | Комментарий | В bd_bur |
|-----------|-------------|----------|
| `BURNAR.ADDONEOPERINNARZAD(NKEY, OPERKEY, DATEIN, APRNUM, RAZDEL, WHO, out NARZADKEY)` | `sAddRab` — добавление одной операции | **нет (мёртвый код)** |
| `BURNAR.CALCBEGDATENEXTOPZAD(AOPNARKEY, ATIMENORMA, ARES, out AOPCHANGED, out ANEXTDATE)` | `sClcBegDateNextOp` — заменён на `SetNextDateOperZAD` + `tkeydate` | **нет (мёртвый код)** |
| `BURNAR.MOVEOPZAD(AKEY, TOPRNUM)` | `sMoveRab` — заменён на `Zadanie_operac_move` | **нет (мёртвый код)** |
| `BURNAR.REORDERNAR_ZADVIP(ANARKEY, ATIPNAR)` | `sORDERNAR` — заменён на `ZADANIE_RENUMLEVEL` | **нет (мёртвый код)** |
| `BURNAR.COPYZADTOVIP(ANARKEY)` | `sCopyZadToVip` — заменён на `VIPOLNENIE_CREATE` | **нет (мёртвый код)** |
| `BURNAR.COPYOPZAD(ASRCKEY, TOPRNUM)` | `sCopyOper` — заменён на `Zadanie_operac_copy` | **нет (мёртвый код)** |

Дополнительно в `bd_bur` есть `procedures/zadanie_add_emp_razdel` (218 стр.) — вставка «пустого»
раздела; форма её не вызывает напрямую (её использует `formStructNur`), но она из того же
семейства и полезна как образец.

---

## 6. Триггеры

| Триггер | Таблица | В bd_bur |
|---------|---------|----------|
| `trg_defnarzad_upd` → `burnar.ftrg_defnarzad_upd()` | `burnar.defnarzad` (BEFORE UPDATE) | DDL триггера **есть**, тело функции `ftrg_defnarzad_upd` — **нет** |
| `trg_defnar_ins_before`, `trg_defnar_ins_after`, `trg_defnar_upd_after`, `trg_defnar_del_after` | `burnar.defnar` | DDL **есть**, тела функций — **нет** |
| `trg_spr_oper_before`, `trg_sproper_upd_bef`, `trg_sproper_del_bef` | `public.spr_oper` | DDL **есть**, тела — **нет** |
| `trg_tematic_razdel_ins_before` | `public.tematic_razdel` | DDL **есть**, тело — **нет** |
| `trg_common_spr_ins_before` | `public.common_spr` | DDL **есть**, тело — **нет** |

Триггеры на `zadanie_oper` / `zadanie_norm` / `zadanie_param` в репозитории отсутствуют
целиком — при переносе надо выяснить, есть ли они в реальной базе, потому что форма рассчитывает
на побочные эффекты процедур (перенумерация, каскадные удаления).

---

## 7. Что уже есть в bd_bur

| Файл | Объект |
|------|--------|
| `defnar.txt` | `burnar.defnar` + 4 триггера |
| `defnarzad.txt` | `burnar.defnarzad` + `trg_defnarzad_upd` |
| `defnarvip.txt` | `burnar.defnarvip` + 2 триггера |
| `sprnartype.txt` | `burnar.sprnartype` |
| `vipolnenie_period.txt` | `burnar.vipolnenie_period` + 3 триггера |
| `znparams.txt` | `burnar.znparams` (**не** `zndefnarzadatrib`) |
| `spr_oper.txt` | `public.spr_oper` |
| `public_common_spr.txt` | `public.common_spr` |
| `tematic_razdel.txt` | `public.tematic_razdel` |
| `org_stru_bur`, `org_stru_tem_cat` | `burnar.org_stru`, `burnar.org_stru_tem_cat` |
| `users_bur`, `people_bur`, `karjera*`, `doljnostruct.txt` / `doljtostruct_bur`, `sprdoljnost.txt`, `spr_workrers.txt` | пользователи, кадры, должности, исполнители |
| `functions/getdolgn` | `burnar.getdolgn` |
| `getallpervip.txt`, `getmasters.txt` | **тела** функций без заголовка `CREATE FUNCTION` (только `DECLARE ... BEGIN ... END`) |
| `procedures/zadanie_add_razdel.txt`, `procedures/zadanie_add_emp_razdel` | вставка разделов в задание |
| `procedures/vipolnenie_add_razdel.txt`, `procedures/vipolnenie_add_emp_razdel` | вставка разделов в выполнение |
| `procedures/add_user.txt`, `change_password.txt`, `change_password_strict.txt`, `deleteUser.txt`, `karjera_add.txt`, `people_add.txt` | администрирование |

Дубликаты в репозитории: `karjera.txt` = `karjera_bur`, `doljnostruct.txt` = `doljtostruct_bur`.

---

## 8. Что нужно добавить в bd_bur

### Таблицы (критично — без них форму не воспроизвести)

- [ ] `burnar.zadanie_oper` (ядро дерева работ)
- [ ] `burnar.zadanie_norm`
- [ ] `burnar.zadanie_param`
- [ ] `burnar.zadanie_ist`
- [ ] `burnar.zadanie_anynm`
- [ ] `burnar.zadanie_stroka`
- [ ] `burnar.zndefnarzadatrib`
- [ ] `burnar.ot_params`, `burnar.do_params` (таблицы или представления)
- [ ] `burnar.tkeydate`
- [ ] `burnar.spr_eks`
- [ ] `public.user_param`, `public.spr_edizm`, `public.zn_dparam`
- [ ] `public.operlife`, `public.comboperparam`, `public.alg_operlife`, `public.algs`, `public.algzndparam`, `public.alguserparam`
- [ ] `public.norms`, `public.sbor_norm`, `public.all_norms`, `public.normist`, `public.normstr`
- [ ] `public.istochniki`
- [ ] `public.spr_izmer`, `public.cfg_izmer`, `public.oper_izmer`, `public.tech_proc_cfg`
- [ ] уточнить `burnar.narzad` — существует ли (используется в `SetWorker`)

### Функции

- [ ] `burnar.zadanie_GetOperIst(key)`
- [ ] `burnar.seq_return(...)`
- [ ] `burnar.CheckNarParams(nkey)`, `burnar.valid_user_f(...)` — для полноты приложения
- [ ] заголовки `CREATE FUNCTION` для `getallpervip` и `getmasters` (сейчас только тела)
- [ ] тела триггерных функций: `ftrg_defnarzad_upd`, `ftrg_defnar_*`, `ftrg_common_spr_ins_before`, `ftrg_tematic_razdel_ins_before`, `ftrg_spr_oper_*`

### Процедуры

- [ ] `burnar.ZADANIE_ADD_EMPTYBLOCK`
- [ ] `burnar.ZADANIE_OPERAC_DEL`
- [ ] `burnar.ZADANIE_OPERAC_DEL_BLOCK`
- [ ] `burnar.Zadanie_operac_copy`
- [ ] `burnar.Zadanie_operac_move`
- [ ] `burnar.ZADANIE_RENUMLEVEL`
- [ ] `burnar.ZADANIE_CALC_OPERP`
- [ ] `burnar.ZADANIE_REBUILD_OPER`
- [ ] `burnar.ZADANIE_CLOSENAR`
- [ ] `burnar.SetNextDateOperZAD`
- [ ] `burnar.VIPOLNENIE_CREATE`

### Можно не добавлять (мёртвый код формы)

`burnar.getnarzad`, `burnar.zadanie_calc_oper`, `burnar.calcnormzad`, `burnar.valnormzad`,
`BURNAR.ADDONEOPERINNARZAD`, `BURNAR.CALCBEGDATENEXTOPZAD`, `BURNAR.MOVEOPZAD`,
`BURNAR.REORDERNAR_ZADVIP`, `BURNAR.COPYZADTOVIP`, `BURNAR.COPYOPZAD`, `GetZRazdelStat`.
Если объекты в реальной базе есть — выгрузить их стоит для истории, но веб-версии они не нужны.

---

## 9. Замечания к схеме

1. **Норма хранится в минутах.** Чтение — `round(norma / 60, 2)`, запись — `norma / kf`, где
   `kf = kedIsh / kedOut` считается в `MainUnit.SetMainCalcSetting` по `public.spr_edizm.ked`.
   То есть единица отображения зависит от ini-настройки `OutEdizm`, а не только от схемы.
2. **`prnum` в `zadanie_norm` и в `zadanie_oper` — разные вещи.** В `zadanie_norm` это номер
   компонента вектора нормы (1 — на единицу, 2 — на объём), в `zadanie_oper` — порядковый номер
   строки внутри уровня (`numeric`, чтобы вставлять «между»).
3. **`isSkv` возвращает коды цветов** `14811101` (совпадает со сквозным) и `11777023` (не
   совпадает), которые грид использует как `ColorValueField`. Цвета зашиты в SQL.
4. **Захардкоженный массив разделов** `array[13555..13566]` в `qrNarZad` даёт признак `RS`,
   запрещающий переименование/удаление системных блоков. Кандидат на флаг в
   `public.tematic_razdel`.
5. **Смешанные схемы для одних и тех же таблиц.** В задании `qrNormAtribName` пишет
   `from cfg_izmer c, spr_edizm s` (без схемы), в выполнении — `from burnar.cfg_izmer c,
   burnar.spr_edizm s`. Нужно определить единственно верную схему.
6. **`burnar.tkeydate` рассчитан на `os_user`** из переменной сессии
   (`set USERENV.OS_USER = ...` в `MainUnit`). В веб-приложении с пулом соединений так работать
   нельзя: процедура `SetNextDateOperZAD` должна возвращать набор напрямую либо принимать явный
   идентификатор запроса.
7. **Регистр имён.** В `.dfm` процедуры записаны как `BURNAR.ZADANIE_...` и
   `burnar.zadanie_...` вперемешку; в PostgreSQL без кавычек это одно и то же, но при выгрузке
   DDL стоит нормализовать в нижний регистр.
