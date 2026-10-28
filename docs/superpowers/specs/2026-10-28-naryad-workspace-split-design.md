# Разбиение NaryadWorkspaceService

## Цель

Разгрузить `NaryadWorkspaceService` (1534 строки), разложив его по сценариям карточки наряда. Поведение HTTP, текст SQL, коды и тексты ошибок, границы транзакций и набор тестов сохраняются. Меняется только владелец кода.

Подтверждённый способ: сервисы по сценарию. Задание и выполнение остаются двумя входами одного сервиса и расходятся только SQL и типом ключа, как уже сделано в `NaryadOperCalcService` и `NaryadSkvParamsService`. Отдельные сервисы на вкладку не создаются. Фасад `NaryadWorkspaceService` не остаётся. `NaryadWorkspaceController` остаётся одним классом и вызывает новые сервисы напрямую.

## Что не меняется

- Пути, методы и тела `/api/naryady/{id}/...`.
- DTO и сообщения `ResponseStatusException`.
- Текст SQL, включая фрагмент RS и имена процедур.
- `@Transactional` только у четырёх операций цвета. Закрытие части, блокировка, импорт, замена задания, удаление, вставка, пустой блок и переименование остаются вне транзакции Spring: их процедуры содержат `COMMIT` и вызываются при `autocommit`.
- `NaryadClipboard`, `NaryadWorkDeletion`, `NaryadProcedureMessages`, `NaryadOperCalc`, `NaryadOperCalcService` и правила `NaryadSkvParams`.
- Фронтенд.
- Пакет `burnar.service`. Подпакетов и интерфейсов сервисов нет. `SqlWork` — приватный функциональный тип внутри `NaryadAutocommit`, замена нынешнего `AutocommitWork`.

Единственные разрешённые правки соседних классов:

- `NaryadOperCalcService` вызывает `NaryadOperFormat.formatBegoperdate`.
- `NaryadSkvParamsService` получает число заблокированных работ методом `NaryadPartCommandService.countVipolnenieLocked`, а не константой SQL.

## Состав

Пять сервисов сценариев и три помощника. Помощники не появляются в контроллере.

| Тип | Ответственность |
|---|---|
| `NaryadOperFormat` | Чистые функции без JDBC и Spring |
| `NaryadAutocommit` | Общий `setAutoCommit(true)` и привязка аргументов `CallableStatement` |
| `NaryadPartAccess` | Один текст `SELECT closed ... FOR UPDATE` и чтение признака закрытия |
| `NaryadOperTreeService` | Ленивое дерево, итоги, признак кнопок строки |
| `NaryadOperParamsService` | Параметры операции и текст алгоритма |
| `NaryadRowColorService` | Цвет одной строки и пачки |
| `NaryadPartCommandService` | Закрытие части, пустое выполнение, импорт, замена задания, блокировка |
| `NaryadOperEditService` | Удаление, снимок структуры, вставка, пустой блок, переименование |

`NaryadPartAccess` держит строку описателя в одном месте: её читают цвет, команды и правка дерева. Это не шестой сценарий и не проверка прав. Проверка доступа по-прежнему `NaryadListService.findHeader`.

## NaryadOperFormat

Класс `final`, приватный конструктор, без состояния. Методы пакетно-видимые и статические, как сейчас:

- `formatBegoperdate(Timestamp)`;
- `loadsParams(Integer)` для типов 79 и 80;
- `loadsAlgorithm(Integer)` для типа 80;
- `requireValidColor(Integer)` — целое `0..16777215`, иначе 400;
- `requireNodeIds(List<Long>)` — пустой список, `null` и `null` внутри дают 400, повторы схлопываются с сохранением порядка.

Константы `OPERTYPE_COMBINATION = 79` и `OPERTYPE_ALGORITHM = 80` живут здесь.

## NaryadAutocommit

`@Component`. Повторяющийся блок «запомнить autocommit, включить его, выполнить, вернуть прежнее значение в `finally`» переезжает сюда. Тела вызовов процедур не переписываются: сервисы по-прежнему сами готовят `CallableStatement` с теми же позициями и типами.

Два входа:

- `run(SqlWork)` пробрасывает `DataAccessException`. Так вызывается удаление работ: `NaryadWorkDeletion.deleteMarked` сам собирает тексты ошибок. `deleteBlock` по-прежнему ловит `DataAccessException` снаружи и переводит его в 409.
- `runMapped(SqlWork)` переводит `DataAccessException` в 409 через `NaryadProcedureMessages.from`. Так вызываются копирование, перемещение, пустой блок, `vipolnenie_create`, `zadanie_closenar`, `copy_vip_to_zad`, `zadanie_to_vipolnenie`, `vipolnenie_lock_oper` и `vipolnenie_un_lock_oper`.

`SqlWork` принимает `Connection` и объявляет `SQLException`. Восстановление прежнего autocommit глушит `SQLException` так же, как сейчас: процедура уже завершила свою транзакцию.

Рядом пакетно-видимые статические методы привязки, перенесённые без изменения типов:

- `bindWorkKey` — `bigint` для выполнения, `integer` через `Math.toIntExact` для задания;
- `bindNullableKey`;
- `bindPrnum`.

## NaryadPartAccess

`@Component`. Пакетно-видимые константы:

- `ZADANIE_DESCRIPTOR_SQL` — `burnar.defnarzad`, `FOR UPDATE`;
- `VIPOLNENIE_DESCRIPTOR_SQL` — `burnar.defnarvip`, `FOR UPDATE`.

`boolean readClosed(boolean zadanie, int naryadId)` повторяет нынешний метод. `zadanie = true` читает описатель задания. Пустой результат даёт 404 «Naryad descriptor not found», `closed = 1` даёт `true`.

Цвет вызывает `readClosed` внутри своего `@Transactional`-метода, поэтому блокировка описателя живёт до конца транзакции смены цвета. Команды и правка дерева не помечаются `@Transactional`, и блокировка отпускается вместе с одиночным запросом, как сейчас.

Отдельный SQL параметров без `FOR UPDATE` остаётся в `NaryadOperParamsService`: там пустой результат означает «часть закрыта», а не 404.

## NaryadOperTreeService

Публичные методы с прежними сигнатурами:

- `findZadanieRoots`, `findZadanieChildren`;
- `findVipolnenieRoots`, `findVipolnenieChildren`;
- `zadanieTotals`, `vipolnenieTotals`;
- `zadanieWorkAction`, `vipolnenieWorkAction`.

Сюда переезжают SQL дерева, условия корня и детей, суммы листьев, `ZADANIE_HAS_ROOTS_SQL`, строки работ для удаления и признака кнопок (`ZADANIE_WORK_ROWS_SQL`, `VIPOLNENIE_WORK_ROWS_SQL`) и `queryTree` / `mapNode`.

Пакетно-видимые методы для соседей:

- `boolean hasZadanieRoots(int naryadId)` — итоги задания и создание пустого выполнения;
- `List<NaryadWorkDeletion.Node> loadWorkNodes(boolean vipolnenie, int naryadId, List<Long> nodeIds)` — признак кнопок и удаление. `vipolnenie = true` читает `burnar.vipolnenie_oper`. Правка дерева вызывает метод, а не копирует SQL.

`getInteger` и `getLong` копируются приватными методами в каждый сервис, который читает `ResultSet`. Общего класса для них нет.

Зависимости: `NamedParameterJdbcTemplate`, `NaryadListService`.

## NaryadOperParamsService

Публичные методы:

- `findZadanieParams`, `findVipolnenieParams`;
- `findZadanieAlgorithm`, `findVipolnenieAlgorithm`.

Сюда переезжают SQL параметров и алгоритма, чтение `operlifeid` / `operlifetype` / `locked`, признак редактируемости и дополнение дискретных списков сохранённым значением. `OperRef` остаётся приватным классом этого сервиса.

Зависимости: `NamedParameterJdbcTemplate`, `NaryadListService`, `NaryadOperCalcService`. Цикла нет: расчёт зависит только от статического `NaryadOperFormat`.

## NaryadRowColorService

Публичные методы, каждый с `@Transactional`:

- `updateZadanieColor`, `updateVipolnenieColor`;
- `updateZadanieColors`, `updateVipolnenieColors`.

Сюда переезжают четыре `UPDATE` цвета. Перед записью сервис читает описатель через `NaryadPartAccess`. Закрытая часть даёт 409 «Naryad part is closed». Число обновлённых строк должно совпасть с числом запрошенных id, иначе 404 «Naryad row not found». Проверка цвета и списка id — `NaryadOperFormat`.

Зависимости: `NamedParameterJdbcTemplate`, `NaryadListService`, `NaryadPartAccess`.

## NaryadPartCommandService

Публичные методы без `@Transactional`:

- `setZadanieClosed`, `setVipolnenieClosed`;
- `createEmptyVipolnenie`, `importZadanieWorks`, `replaceZadanieFromVipolnenie`;
- `lockVipolnenie`, `unlockVipolnenie`, `vipolnenieLockFlags`.

Пакетно-видимый `long countVipolnenieLocked(int naryadId)` заменяет прямое чтение `VIPOLNENIE_LOCKED_COUNT_SQL` из `NaryadSkvParamsService`. SQL этой константы остаётся в командном сервисе.

Сюда же переезжают открытие и закрытие описателей, пороги импорта, обход выделения для блокировки, сообщения «Не все работы заблокированы!», «Наряд-выполнение уже создано», «Наряд-задание не закрыто», «В задании нет работ», «В выполнении уже есть работы», «Импорт недоступен: есть заблокированные работы», «Работа уже заблокирована». `OrderedWork` остаётся приватным.

Зависимости: `NamedParameterJdbcTemplate`, `NaryadListService`, `NaryadOperTreeService`, `NaryadPartAccess`, `NaryadAutocommit`. Обратной зависимости на сквозные параметры нет.

## NaryadOperEditService

Один сервис на правку дерева. Отдельно удаление и буфер не выделяются.

Публичные методы без `@Transactional`:

- `deleteZadanieWorks`, `deleteVipolnenieWorks`;
- `deleteZadanieBlock`, `deleteVipolnenieBlock`;
- `zadanieStructure`, `vipolnenieStructure`;
- `pasteZadanie`, `pasteVipolnenie`;
- `addZadanieEmptyBlock`, `addVipolnenieEmptyBlock`;
- `renameZadanieBlock`, `renameVipolnenieBlock`.

Сюда переезжают SQL процедур удаления, проверки существования работы, снимка структуры и переименования. Снимок структуры обслуживает и GET `/structure`, и буфер: это один и тот же запрос. Фрагмент RS внутри снимка копируется текстом в этот сервис и не собирается общим построителем. `FreshOper` остаётся приватным.

Удаление работ вызывает `NaryadAutocommit.run`, чтобы `NaryadWorkDeletion.deleteMarked` видел исходное `DataAccessException`. Остальные процедуры правки идут через `runMapped`.

Зависимости: `NamedParameterJdbcTemplate`, `NaryadListService`, `NaryadOperTreeService`, `NaryadPartAccess`, `NaryadAutocommit`.

## Контроллер

`NaryadWorkspaceController` получает пять сервисов сценариев вместо `NaryadWorkspaceService`. `NaryadOperCalcService` остаётся для расчёта и сохранения параметра. Каждый метод контроллера делегирует прежнему владельцу сценария. `ExceptionHandler` остаётся на контроллере.

После переноса `NaryadWorkspaceService` удаляется. На класс не остаётся ссылок.

## Зависимости

```text
Controller
  -> Tree, Params, Color, Command, Edit, OperCalc

Params -> OperCalc -> NaryadOperFormat
Command -> Tree
Edit -> Tree
SkvParams -> Command
Color, Command, Edit -> PartAccess
Command, Edit -> Autocommit
```

Циклов нет. `NaryadListService` остаётся общим чтением заголовка и проверкой доступа.

## Тесты

Константы SQL, которые читают тесты, остаются пакетно-видимыми на классе-владельце. `NaryadWorkspaceServiceTest` распадается по владельцам в том же шаге, где уезжает константа или функция. Утверждения и ожидаемые фрагменты SQL не переписываются, меняется только класс-владелец:

- формат даты, типы 79/80, цвет и `requireNodeIds` — тест `NaryadOperFormat`;
- SQL дерева, условий корня и детей и строк работ — тест `NaryadOperTreeService`;
- SQL параметров и алгоритма — тест `NaryadOperParamsService`;
- SQL цвета и описателя `FOR UPDATE` — тесты `NaryadRowColorService` и `NaryadPartAccess` соответственно;
- SQL признаков блокировки — тест `NaryadPartCommandService`;
- SQL удаления, структуры и переименования — тест `NaryadOperEditService`.

`NaryadClipboardTest`, `NaryadWorkDeletionTest`, `NaryadOperCalcTest` и `NaryadSkvParamsTest` сохраняют свои проверки. Прогон — существующие модульные тесты backend без новой базы.

## Порядок переноса

Каждый шаг компилируется и проходит текущие тесты. Следующий шаг начинается только после этого.

1. `NaryadOperFormat` и `NaryadAutocommit`. Вызовы даты и процедур переключаются на них, публичные методы ещё живут в `NaryadWorkspaceService`.
2. `NaryadPartAccess` и `NaryadOperTreeService`.
3. `NaryadOperParamsService`.
4. `NaryadRowColorService`.
5. `NaryadPartCommandService` и вызов из `NaryadSkvParamsService`.
6. `NaryadOperEditService`.
7. Контроллер переключается на пять сервисов, `NaryadWorkspaceService` удаляется.

Внутри шага тела методов переносятся как есть. Новая логика, объединение SQL задания и выполнения в один шаблон и смена уровня транзакций в этот перенос не входят.

## Проверка готовности

- `NaryadWorkspaceService` отсутствует, поиск по репозиторию его не находит.
- Контроллер покрывает те же маршруты, что до переноса.
- Ни один публичный метод команд и правки не помечен `@Transactional`.
- Четыре метода цвета помечены `@Transactional`.
- Удаление работ по-прежнему получает исходное исключение драйвера и собирает несколько сообщений через перевод строки.
- Модульные тесты backend проходят.
