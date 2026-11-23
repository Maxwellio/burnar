# Разложение бэкенда по фичам

> План на утверждение. До подтверждения код не переносится.

**Цель:** разложить DTO, контроллеры и сервисы по фичам, а внутри фичи — по пакетам `dto`, `controller` и `service`.

**Подход:** перенос файлов и правка `package` / `import`. Классы не переименовываются. URL, SQL, JSON и поведение методов не меняются. `@SpringBootApplication` на `burnar` уже сканирует подпакеты.

**Стек:** Java 17, Spring Boot 2.7.8, Maven. Проверка каждого шага: `mvn -q test` из `backend`.

## Ограничения

- Префикс `/api/naryady` и пути методов сохраняются. Несколько контроллеров могут делить один `@RequestMapping`.
- Пакет слоя создаётся только если в нём есть класс. Пустой `controller` у `naryad.shared` не создаётся.
- `config` остаётся `burnar.config`.
- `UserEntity` и `UserRepository` переезжают в `burnar.security` без отдельных пакетов `entity` и `repository`: других сущностей нет.
- Пакетно-приватные методы, которые после переноса вызываются из другого пакета, становятся `public`. Остальная видимость сохраняется.
- Тест переезжает в пакет класса, чьи пакетно-приватные члены он читает.
- У каждого контроллера, вырезанного из `NaryadWorkspaceController`, копируется его нынешний `@ExceptionHandler(ResponseStatusException.class)`. Новый `@ControllerAdvice` не заводится: обработчик сейчас действует только на этот контроллер.
- Старый комментарий в `docs/superpowers/specs/2026-10-28-naryad-workspace-split-design.md` про единый пакет `burnar.service` описывает прошлую фичу и этим планом не правится.

## Куда что кладётся

`NaryadWorkDeletion` стоит в `naryad.shared.service`, а не в правке дерева. `NaryadOperTreeService.loadWorkNodes` возвращает `NaryadWorkDeletion.Node`, а правка вызывает `loadWorkNodes`. Если класс оставить в `oper.edit`, пакеты дерева и правки зациклятся.

`NaryadNodeIdsRequest` стоит в `naryad.shared.dto`: тело запроса общее для удаления работ, блокировки и разблокировки. `NaryadSkvValueDto` там же: его читают параметры скважины и расчёт операции. `NaryadPeriodTotalDto` остаётся у дерева: его собирает `NaryadOperTreeService`, а не сервис периодов. `NaryadHeaderDto` остаётся у списка.

### Общие и мелкие фичи

| Пакет | Классы |
|---|---|
| `burnar.common.dto` | `IdResponse` |
| `burnar.security` | `UserDetailsServiceImpl` (уже здесь), `UserEntity`, `UserRepository` |
| `burnar.auth.controller` | `AuthController` |
| `burnar.auth.dto` | `CurrentUserDto` |
| `burnar.web.controller` | `HealthController`, `SpaForwardController` |
| `burnar.org.controller` | `OrgUnitController` |
| `burnar.org.dto` | `OrgUnitDto` |
| `burnar.org.service` | `OrgAccessService` |
| `burnar.admin.user.controller` | `AdminUserController` |
| `burnar.admin.user.dto` | `AdminUserDto`, `AdminUserDetailDto`, `AdminUserWriteRequest` |
| `burnar.admin.user.service` | `AdminUserService`, `AdminUserListFilters` |
| `burnar.admin.position.controller` | `PositionAdminController` |
| `burnar.admin.position.dto` | `PositionDto`, `PositionWriteRequest` |
| `burnar.admin.position.service` | `PositionAdminService` |
| `burnar.person.controller` | `ResponsiblePersonController` |
| `burnar.person.dto` | `ResponsiblePersonDto`, `ResponsiblePersonDetailDto`, `ResponsiblePersonCreateRequest`, `ResponsiblePersonUpdateRequest`, `CareerDto`, `CareerWriteRequest` |
| `burnar.person.service` | `ResponsiblePersonService` |
| `burnar.catalog.controller` | `TematicRazdelController` |
| `burnar.catalog.dto` | `TematicRazdelNodeDto` |
| `burnar.catalog.service` | `TematicRazdelService` |
| `burnar.ocard.controller` | `OcardFileController` |
| `burnar.ocard.dto` | `NaryadOcardFileDto` |
| `burnar.ocard.service` | `OcardService`, `OcardStorage` |

### Наряд

| Пакет | Классы |
|---|---|
| `burnar.naryad.shared.dto` | `DeleteBlockDto`, `NaryadSkvValueDto`, `NaryadNodeIdsRequest` |
| `burnar.naryad.shared.service` | `NaryadAutocommit`, `NaryadProcedureMessages`, `NaryadPartAccess`, `NaryadOperFormat`, `NaryadOperCalc`, `NaryadMasterGuard`, `NaryadWorkDeletion` |
| `burnar.naryad.list.controller` | `NaryadListController` |
| `burnar.naryad.list.dto` | `NaryadListDto`, `NaryadListFilter`, `NaryadHeaderDto`, `NaryadMasterDto`, `NaryadCreateRequest`, `NaryadCreatedDto`, `BrigadeDto`, `YearMonthsDto` |
| `burnar.naryad.list.service` | `NaryadListService`, `NaryadListCommandService`, `NaryadListCommandRules` |
| `burnar.naryad.oper.tree.controller` | новый `NaryadOperTreeController` |
| `burnar.naryad.oper.tree.dto` | `NaryadOperNodeDto`, `NaryadDurationTotalsDto`, `NaryadWorkActionDto`, `NaryadPeriodTotalDto` |
| `burnar.naryad.oper.tree.service` | `NaryadOperTreeService` |
| `burnar.naryad.oper.edit.controller` | новый `NaryadOperEditController` |
| `burnar.naryad.oper.edit.dto` | `NaryadCatalogInsertRequest`, `NaryadEmptyBlockRequest`, `NaryadPasteRequest`, `NaryadRenameBlockRequest`, `NaryadStructureNodeDto` |
| `burnar.naryad.oper.edit.service` | `NaryadOperEditService`, `NaryadClipboard` |
| `burnar.naryad.oper.params.controller` | новый `NaryadOperParamsController` |
| `burnar.naryad.oper.params.dto` | `NaryadOperParamDto`, `NaryadOperParamSaveDto`, `NaryadOperParamValueRequest`, `NaryadAlgorithmDto`, `NaryadCalcDateDto`, `NaryadCalcNodeDto`, `NaryadCalcResultDto` |
| `burnar.naryad.oper.params.service` | `NaryadOperParamsService`, `NaryadOperCalcService` |
| `burnar.naryad.period.controller` | новый `NaryadPeriodController` |
| `burnar.naryad.period.dto` | `NaryadPeriodDto`, `NaryadPeriodBindRequest`, `NaryadPeriodWriteRequest` |
| `burnar.naryad.period.service` | `NaryadPeriodService`, `NaryadPeriodRules` |
| `burnar.naryad.interval.controller` | новый `NaryadIntervalController` |
| `burnar.naryad.interval.dto` | `NaryadIntervalRowDto` |
| `burnar.naryad.interval.service` | `NaryadIntervalService` |
| `burnar.naryad.factdate.controller` | новый `NaryadFactDateController` |
| `burnar.naryad.factdate.dto` | `NaryadFactDateDto`, `NaryadFactDateRequest` |
| `burnar.naryad.factdate.service` | `NaryadFactDateService`, `NaryadFactDateRules` |
| `burnar.naryad.color.controller` | новый `NaryadRowColorController` |
| `burnar.naryad.color.dto` | `NaryadRowColorDto`, `NaryadRowColorRequest`, `NaryadRowsColorDto`, `NaryadRowsColorRequest` |
| `burnar.naryad.color.service` | `NaryadRowColorService` |
| `burnar.naryad.part.controller` | новый `NaryadPartController` |
| `burnar.naryad.part.dto` | `NaryadClosedDto`, `NaryadClosedRequest`, `NaryadLockTargetDto`, `NaryadWorkLockDto` |
| `burnar.naryad.part.service` | `NaryadPartCommandService` |
| `burnar.naryad.skv.controller` | `NaryadSkvParamsController` |
| `burnar.naryad.skv.dto` | `NaryadSkvHeaderDto`, `NaryadSkvParamDto`, `NaryadSkvSaveRequest`, `NaryadSkvSaveResultDto` |
| `burnar.naryad.skv.service` | `NaryadSkvParamsService`, `NaryadSkvParams` |

### Методы, которые станут `public`

В том же коммите, где класс уезжает от вызывающих:

- `NaryadAutocommit.bindNullableKey`, `bindPrnum`, `bindWorkKey`
- `NaryadOperFormat.requireNodeIds`, `requireValidColor`, `loadsParams`, `loadsAlgorithm`, `formatBegoperdate`
- `NaryadOperTreeService.loadWorkNodes`

`parseMastersJson`, `colorCode`, `nestForest`, `hoursOrZero` и правила внутри одной фичи (`NaryadFactDateRules`, `NaryadPeriodRules`, `NaryadListCommandRules`, `AdminUserListFilters`) остаются пакетно-приватными. Их тесты едут следом.

### Разрез `NaryadWorkspaceController`

Класс удаляется после переноса методов. У всех новых контроллеров `@RequestMapping("/api/naryady")`. Тела методов и аннотации копируются как есть. Рядом копируется `handleStatus`.

`NaryadOperTreeController` — чтение дерева и о-карты узла, для задания и выполнения:

- `GET /{id}/zadanie`, `GET /{id}/zadanie/{nodeId}/children`, `GET /{id}/zadanie/totals`, `GET /{id}/zadanie/nodes/{nodeId}/action`, `GET /{id}/zadanie/nodes/{nodeId}/ocards`
- `GET /{id}/vipolnenie`, `GET /{id}/vipolnenie/{nodeId}/children`, `GET /{id}/vipolnenie/totals`, `GET /{id}/vipolnenie/period-totals`, `GET /{id}/vipolnenie/nodes/{nodeId}/action`, `GET /{id}/vipolnenie/nodes/{nodeId}/ocards`

`NaryadOperEditController`:

- `POST /{id}/zadanie/works/delete`, `POST /{id}/zadanie/blocks/{nodeId}/delete`, `GET /{id}/zadanie/structure`, `POST /{id}/zadanie/clipboard/paste`, `POST /{id}/zadanie/blocks`, `POST /{id}/zadanie/catalog`, `PATCH /{id}/zadanie/blocks/{nodeId}/name`
- те же пути с `vipolnenie` вместо `zadanie`

`NaryadOperParamsController` — параметры и расчёт:

- `GET /{id}/zadanie/params`, `GET /{id}/zadanie/algorithm`, `POST /{id}/zadanie/{nodeId}/calc`, `PUT /{id}/zadanie/{nodeId}/params/{parcode}`
- те же пути с `vipolnenie`

`NaryadPeriodController`:

- `GET/POST /{id}/vipolnenie/periods`, `PUT/DELETE /{id}/vipolnenie/periods/{periodKey}`, `POST /{id}/vipolnenie/periods/bind`

`NaryadIntervalController`:

- `GET /{id}/vipolnenie/intervals/mehbur`, `GET /{id}/vipolnenie/intervals/narashchivanie`

`NaryadFactDateController`:

- `GET/PUT /{id}/vipolnenie/nodes/{nodeId}/begoperdate`

`NaryadRowColorController`:

- `PATCH /{id}/zadanie/{nodeId}/color`, `PATCH /{id}/zadanie/colors`
- `PATCH /{id}/vipolnenie/{nodeId}/color`, `PATCH /{id}/vipolnenie/colors`

`NaryadPartController`:

- `POST /{id}/zadanie/nodes/{nodeId}/renumber`, `POST /{id}/zadanie/closed`
- `POST /{id}/vipolnenie`, `POST /{id}/vipolnenie/import-zadanie`, `POST /{id}/vipolnenie/replace-zadanie`
- `POST /{id}/vipolnenie/nodes/{nodeId}/renumber`, `POST /{id}/vipolnenie/closed`
- `GET /{id}/vipolnenie/lock-flags`, `POST /{id}/vipolnenie/lock`, `POST /{id}/vipolnenie/unlock`

О-карты узла остаются на URL наряда и вызывают `OcardService`. Скачивание файла остаётся в `OcardFileController` на `/api/ocards`.

### Тесты

| Файл | Новый пакет |
|---|---|
| `AdminUserListFiltersTest` | `burnar.admin.user.service` |
| `PositionAdminServiceDeleteTest` | `burnar.admin.position.service` |
| `TematicRazdelServiceTest` | `burnar.catalog.service` |
| `NaryadMasterGuardTest` | `burnar.naryad.shared.service` |
| `NaryadOperCalcTest` | `burnar.naryad.shared.service` |
| `NaryadOperFormatTest` | `burnar.naryad.shared.service` |
| `NaryadPartAccessTest` | `burnar.naryad.shared.service` |
| `NaryadWorkDeletionTest` | `burnar.naryad.shared.service` |
| `NaryadListCommandRulesTest`, `NaryadListCommandServiceTest`, `NaryadMastersJsonTest` | `burnar.naryad.list.service` |
| `NaryadOperTreeServiceTest` | `burnar.naryad.oper.tree.service` |
| `NaryadClipboardTest`, `NaryadOperEditServiceTest` | `burnar.naryad.oper.edit.service` |
| `NaryadOperParamsServiceTest` | `burnar.naryad.oper.params.service` |
| `NaryadPeriodRulesTest`, `NaryadPeriodServiceTest` | `burnar.naryad.period.service` |
| `NaryadIntervalServiceTest` | `burnar.naryad.interval.service` |
| `NaryadFactDateRulesTest` | `burnar.naryad.factdate.service` |
| `NaryadRowColorServiceTest` | `burnar.naryad.color.service` |
| `NaryadPartCommandServiceTest` | `burnar.naryad.part.service` |
| `NaryadSkvParamsTest` | `burnar.naryad.skv.service` |
| `BurnarPropertiesAdminTest` | остаётся `burnar.config` |

В `NaryadMastersJsonTest` три класса: `NaryadMastersJsonTest`, `NaryadMasterSqlContractTest`, `NaryadHeaderSqlContractTest`. Файл переезжает целиком.

## Порядок шагов

Каждый шаг — один коммит. Внутри шага: `git mv`, новая строка `package`, импорты у переехавших и у тех, кто их ещё вызывает, перенос тестов этого шага, `mvn -q test` из `backend`.

1. `common`, `security`, `auth`, `web`. Импорты `IdResponse`, `UserEntity`, `UserRepository`, `CurrentUserDto`.
2. `org`, затем `admin.user` и `admin.position`. `AdminUserListFilters` остаётся в одном пакете с `AdminUserService`.
3. `catalog` и `ocard`.
4. `naryad.shared`. В этом шаге расширяется видимость методов `NaryadAutocommit` и `NaryadOperFormat`. Вызывающие пока остаются в `burnar.service` и получают новые импорты.
5. `naryad.list` вместе с `NaryadListController`.
6. `person`. Он зависит от `OrgAccessService`, `IdResponse`, `DeleteBlockDto` и `NaryadMasterGuard`, поэтому идёт после них.
7. `naryad.oper.tree`: сервис, DTO и `NaryadOperTreeController` с методами из списка выше. `loadWorkNodes` становится `public`. Методы вырезаются из `NaryadWorkspaceController`.
8. `naryad.oper.edit`: сервис, буфер, DTO и `NaryadOperEditController`.
9. `naryad.oper.params`: оба сервиса, DTO и `NaryadOperParamsController`.
10. `period`, `interval`, `factdate`, `color` — четыре фичи одним шагом, у каждой свой контроллер.
11. `naryad.part` и удаление опустевшего `NaryadWorkspaceController`.
12. `naryad.skv`.
13. Комментарий в `BurnarApplication` заменить на описание фич. Убедиться, что каталоги `burnar/dto`, `burnar/controller`, `burnar/service`, `burnar/entity`, `burnar/repository` пусты и удалены. Полный `mvn -q test`.

Фронтенд и `application.properties` не меняются.
