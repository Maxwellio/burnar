package burnar.service;

import burnar.dto.CareerDto;
import burnar.dto.IdResponse;
import burnar.dto.OrgUnitDto;
import burnar.dto.ResponsiblePersonCreateRequest;
import burnar.dto.ResponsiblePersonDetailDto;
import burnar.dto.ResponsiblePersonDto;
import burnar.dto.ResponsiblePersonUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Date;
import java.sql.Types;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * API ответственных лиц (Delphi formUsersDoljn / formPeopleAdd).
 * Read: список + карьеры; Write: people_add / UPDATE people / deleteUser.
 * ACL — parent-поддерево; orgUnitId учитывается только у админа.
 * Подробности CRUD — docs/responsible-persons-crud-notes.md.
 */
@Service
public class ResponsiblePersonService {

    /**
     * Корни Select «структура» — как Delphi qrPodr (id in 1,5,6,7,8,123).
     * Не путать с burnar.org-filter-ids у нарядов.
     */
    private static final List<Integer> PODR_FILTER_IDS = List.of(1, 5, 6, 7, 8, 123);

    /** Корни комбо подразделения в форме add — Delphi strqrOrgNMQueryAdmin (+91). */
    private static final List<Integer> ORG_TREE_ADMIN_ROOTS = List.of(1, 5, 6, 7, 8, 91, 123);

    /** Полный путь подразделения — тот же CTE, что OWNER_PATH_SQL у нарядов. */
    private static final String ORG_PATH_SQL =
            "(WITH RECURSIVE tmp(id, parent, nm, path, level) AS ( "
                    + "   SELECT o.id, o.parent, o.nm, CAST(o.nm AS varchar(100)), 1 "
                    + "   FROM burnar.org_stru o WHERE o.parent = 0 "
                    + "   UNION ALL "
                    + "   SELECT o2.id, o2.parent, o2.nm, "
                    + "          CAST(tmp.path || ', ' || o2.nm AS varchar(100)), level + 1 "
                    + "   FROM burnar.org_stru o2 "
                    + "   INNER JOIN tmp ON tmp.id = o2.parent "
                    + ") SELECT tmp.path FROM tmp WHERE tmp.id = d.org)";

    private static final String PEOPLE_FROM =
            "FROM burnar.karjera k "
                    + "JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                    + "JOIN burnar.people p ON p.id = k.idpeople "
                    + "LEFT JOIN burnar.users u ON u.people_id = p.id ";

    private static final RowMapper<ResponsiblePersonDto> PEOPLE_MAPPER = (rs, rowNum) -> {
        ResponsiblePersonDto dto = new ResponsiblePersonDto();
        dto.setId(rs.getInt("id"));
        dto.setFio(rs.getString("fio"));
        dto.setOraName(rs.getString("ora_name"));
        return dto;
    };

    private static final RowMapper<CareerDto> CAREER_MAPPER = (rs, rowNum) -> {
        CareerDto dto = new CareerDto();
        dto.setId(rs.getInt("id"));
        dto.setDtEnter(rs.getString("dtenter"));
        dto.setDtOut(rs.getString("dtout"));
        dto.setDoljNm(rs.getString("dolj_nm"));
        dto.setOrgNm(rs.getString("org_nm"));
        return dto;
    };

    private static final RowMapper<OrgUnitDto> ID_NAME_MAPPER =
            (rs, rowNum) -> new OrgUnitDto(rs.getInt("id"), rs.getString("nm"));

    private final NamedParameterJdbcTemplate jdbc;
    private final OrgAccessService orgAccessService;

    public ResponsiblePersonService(NamedParameterJdbcTemplate jdbc, OrgAccessService orgAccessService) {
        this.jdbc = jdbc;
        this.orgAccessService = orgAccessService;
    }

    /** Справочник СП для админского Select на этой странице (константные id, не org-filter-ids). */
    public List<OrgUnitDto> listFilterOrgUnits() {
        return jdbc.query(
                "SELECT id, nm FROM burnar.org_stru "
                        + "WHERE id IN (:ids) ORDER BY nm",
                new MapSqlParameterSource("ids", PODR_FILTER_IDS),
                ID_NAME_MAPPER);
    }

    /** Справочник должностей для комбо формы add (Delphi qrDoljSpr). */
    public List<OrgUnitDto> listPositions() {
        return jdbc.query(
                "SELECT s.key AS id, s.nm FROM burnar.sprdoljnost s ORDER BY s.nm",
                ID_NAME_MAPPER);
    }

    /**
     * Дерево подразделений с путём для комбо формы add (Delphi LoadCbx).
     * Админ — поддеревья корней ORG_TREE_ADMIN_ROOTS; иначе — от resolveUserOrgId.
     */
    public List<OrgUnitDto> listOrgTree() {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            return Collections.emptyList();
        }

        MapSqlParameterSource params = new MapSqlParameterSource();
        String rootFilter;
        if (orgAccessService.isAdmin(username)) {
            params.addValue("roots", ORG_TREE_ADMIN_ROOTS);
            rootFilter = "o.id IN (:roots)";
        } else {
            Optional<Integer> userOrg = orgAccessService.resolveUserOrgId(username);
            if (userOrg.isEmpty()) {
                return Collections.emptyList();
            }
            params.addValue("podrId", userOrg.get());
            rootFilter = "o.id = :podrId";
        }

        String sql = "WITH RECURSIVE tmp(id, parent, nm, path, level) AS ("
                + "  SELECT o.id, o.parent, o.nm, CAST(o.nm AS varchar(100)), 1 "
                + "  FROM burnar.org_stru o WHERE o.parent = 0 "
                + "  UNION ALL "
                + "  SELECT o2.id, o2.parent, o2.nm, "
                + "         CAST(tmp.path || ', ' || o2.nm AS varchar(100)), level + 1 "
                + "  FROM burnar.org_stru o2 "
                + "  INNER JOIN tmp ON tmp.id = o2.parent"
                + ") "
                + "SELECT tmp.id AS id, tmp.path AS nm "
                + "FROM tmp "
                + "WHERE tmp.id IN ("
                + "  WITH RECURSIVE tmp2 AS ("
                + "    SELECT o.id FROM burnar.org_stru o WHERE " + rootFilter
                + "    UNION ALL "
                + "    SELECT o2.id FROM burnar.org_stru o2 "
                + "    INNER JOIN tmp2 ON o2.parent = tmp2.id"
                + "  ) SELECT tmp2.id FROM tmp2"
                + ") "
                + "ORDER BY tmp.path";
        return jdbc.query(sql, params, ID_NAME_MAPPER);
    }

    /**
     * Pageable-список людей с карьерой в ACL-поддереве (как strUser в Delphi без чекбоксов).
     * DISTINCT — у человека может быть несколько строк karjera в том же поддереве.
     * id/fio/oraName — колоночные фильтры BaseTable (query = accessorKey).
     */
    public Page<ResponsiblePersonDto> findPeople(
            Pageable pageable,
            Integer orgUnitId,
            String id,
            String fio,
            String oraName) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        String username = currentUsername();
        if (!orgAccessService.appendOrgParentSubtreeFilter(
                where, params, username, orgUnitId, "ds.org")) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        appendTextFilter(where, params, "id", id,
                "CAST(p.id AS varchar) ILIKE CONCAT(:id, '%')");
        appendTextFilter(where, params, "fio", fio,
                "p.fio ILIKE CONCAT('%', :fio, '%')");
        appendTextFilter(where, params, "oraName", oraName,
                "u.ora_name ILIKE CONCAT('%', :oraName, '%')");

        String countSql = "SELECT COUNT(*) FROM ("
                + "SELECT DISTINCT p.id " + PEOPLE_FROM + where
                + ") t";
        Long total = jdbc.queryForObject(countSql, params, Long.class);
        if (total == null) {
            total = 0L;
        }

        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());

        String listSql = "SELECT DISTINCT p.id, p.fio, u.ora_name "
                + PEOPLE_FROM + where
                + "ORDER BY p.fio "
                + "LIMIT :limit OFFSET :offset";
        List<ResponsiblePersonDto> content = jdbc.query(listSql, params, PEOPLE_MAPPER);
        return new PageImpl<>(content, pageable, total);
    }

    /** Колоночный текстовый фильтр BaseTable — пустые значения пропускаем. */
    private static void appendTextFilter(
            StringBuilder where,
            MapSqlParameterSource params,
            String paramName,
            String value,
            String condition) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        params.addValue(paramName, value.trim());
        where.append("AND ").append(condition).append(' ');
    }

    /** Карьеры выбранного человека; проверка ACL — человек должен быть виден текущему пользователю. */
    public Page<CareerDto> findCareers(int peopleId, Pageable pageable, Integer orgUnitId) {
        if (!isPersonVisible(peopleId, orgUnitId)) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        MapSqlParameterSource params = new MapSqlParameterSource("peopleId", peopleId);

        String fromSql = "FROM burnar.karjera k "
                + "JOIN burnar.doljtostruct d ON d.key = k.doljinstru "
                + "JOIN burnar.sprdoljnost sp ON sp.key = d.doljnost "
                + "WHERE k.idpeople = :peopleId ";

        Long total = jdbc.queryForObject("SELECT COUNT(*) " + fromSql, params, Long.class);
        if (total == null) {
            total = 0L;
        }

        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());

        String listSql = "SELECT k.key AS id, "
                + "to_char(k.dtenter, 'DD.MM.YYYY') AS dtenter, "
                + "to_char(k.dtout, 'DD.MM.YYYY') AS dtout, "
                + "sp.nm AS dolj_nm, "
                + ORG_PATH_SQL + " AS org_nm "
                + fromSql
                + "ORDER BY k.dtenter, k.dtout "
                + "LIMIT :limit OFFSET :offset";
        List<CareerDto> content = jdbc.query(listSql, params, CAREER_MAPPER);
        return new PageImpl<>(content, pageable, total);
    }

    /** Карточка для формы edit; 404 если нет или вне ACL. */
    public ResponsiblePersonDetailDto getPerson(int peopleId) {
        requirePersonVisible(peopleId);
        List<ResponsiblePersonDetailDto> rows = jdbc.query(
                "SELECT p.id, p.fio, p.fioreports, p.fiorodpad, "
                        + "CASE WHEN p.tabn IS NULL THEN NULL ELSE TRIM(TO_CHAR(p.tabn, 'FM99999999')) END AS tabn "
                        + "FROM burnar.people p WHERE p.id = :id",
                new MapSqlParameterSource("id", peopleId),
                (rs, rowNum) -> {
                    ResponsiblePersonDetailDto dto = new ResponsiblePersonDetailDto();
                    dto.setId(rs.getInt("id"));
                    dto.setFio(rs.getString("fio"));
                    dto.setFioreports(rs.getString("fioreports"));
                    dto.setFiorodpad(rs.getString("fiorodpad"));
                    dto.setTabn(rs.getString("tabn"));
                    return dto;
                });
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found");
        }
        return rows.get(0);
    }

    /**
     * Создать человека + стартовую карьеру через burnar.people_add.
     * fiorodpad сохраняем (в отличие от Delphi, где в SP уходил null).
     */
    public IdResponse createPerson(ResponsiblePersonCreateRequest req) {
        if (req == null || !StringUtils.hasText(req.getFio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fio is required");
        }
        if (req.getOrgId() == null || req.getDoljId() == null || !StringUtils.hasText(req.getDateIn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateIn, orgId, doljId are required");
        }
        LocalDate dateIn;
        try {
            dateIn = LocalDate.parse(req.getDateIn().trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dateIn must be yyyy-MM-dd");
        }

        String fio = req.getFio().trim();
        String fioreports = blankToNull(req.getFioreports());
        String fiorodpad = blankToNull(req.getFiorodpad());
        BigDecimal tabn = parseTabn(req.getTabn());
        int orgId = req.getOrgId();
        int doljId = req.getDoljId();

        Integer newId = jdbc.getJdbcTemplate().execute((Connection con) ->
                callPeopleAdd(con, fio, tabn, fioreports, fiorodpad, dateIn, orgId, doljId));
        if (newId == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "people_add returned null id");
        }
        return new IdResponse(newId);
    }

    /** UPDATE people (fio/tabn/fioreports/fiorodpad) — как ToolButton10 + fiorodpad. */
    public void updatePerson(int peopleId, ResponsiblePersonUpdateRequest req) {
        requirePersonVisible(peopleId);
        if (req == null || !StringUtils.hasText(req.getFio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fio is required");
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", peopleId)
                .addValue("fio", req.getFio().trim())
                .addValue("fioreports", blankToNull(req.getFioreports()))
                .addValue("fiorodpad", blankToNull(req.getFiorodpad()))
                .addValue("tabn", parseTabn(req.getTabn()));
        int updated = jdbc.update(
                "UPDATE burnar.people SET fio = :fio, tabn = :tabn, "
                        + "fioreports = :fioreports, fiorodpad = :fiorodpad WHERE id = :id",
                params);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found");
        }
    }

    /** Каскадное удаление через burnar.deleteUser — только ROLE_ADMIN. */
    public void deletePerson(int peopleId) {
        String username = currentUsername();
        if (!orgAccessService.isAdmin(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
        requirePersonVisible(peopleId);
        jdbc.getJdbcTemplate().execute((Connection con) -> {
            try (CallableStatement cs = con.prepareCall("{call burnar.deleteUser(?)}")) {
                cs.setBigDecimal(1, BigDecimal.valueOf(peopleId));
                cs.execute();
            }
            return null;
        });
    }

    private static Integer callPeopleAdd(
            Connection con,
            String fio,
            BigDecimal tabn,
            String fioreports,
            String fiorodpad,
            LocalDate dateIn,
            int orgId,
            int doljId) throws java.sql.SQLException {
        // INOUT apeople_id — 9-й параметр; acodr3 всегда null (поле не в UI).
        // Escape-syntax {call …} — надёжнее отдаёт INOUT apeople_id через registerOutParameter.
        try (CallableStatement cs = con.prepareCall(
                "{call burnar.people_add(?, ?, ?, ?, ?, ?, ?, ?, ?)}")) {
            cs.setString(1, fio);
            cs.setNull(2, Types.NUMERIC);
            if (tabn != null) {
                cs.setBigDecimal(3, tabn);
            } else {
                cs.setNull(3, Types.NUMERIC);
            }
            if (fioreports != null) {
                cs.setString(4, fioreports);
            } else {
                cs.setNull(4, Types.VARCHAR);
            }
            if (fiorodpad != null) {
                cs.setString(5, fiorodpad);
            } else {
                cs.setNull(5, Types.VARCHAR);
            }
            cs.setDate(6, Date.valueOf(dateIn));
            cs.setInt(7, orgId);
            cs.setInt(8, doljId);
            cs.setNull(9, Types.INTEGER);
            cs.registerOutParameter(9, Types.INTEGER);
            cs.execute();
            int id = cs.getInt(9);
            return cs.wasNull() ? null : id;
        }
    }

    private void requirePersonVisible(int peopleId) {
        if (!isPersonVisible(peopleId, null)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Person not found");
        }
    }

    /** Тот же ACL, что у списка: нельзя подсмотреть/править человека вне своего поддерева. */
    private boolean isPersonVisible(int peopleId, Integer orgUnitId) {
        MapSqlParameterSource params = new MapSqlParameterSource("peopleId", peopleId);
        StringBuilder where = new StringBuilder("WHERE p.id = :peopleId ");
        String username = currentUsername();
        if (!orgAccessService.appendOrgParentSubtreeFilter(
                where, params, username, orgUnitId, "ds.org")) {
            return false;
        }
        String sql = "SELECT COUNT(*) FROM ("
                + "SELECT DISTINCT p.id " + PEOPLE_FROM + where
                + ") t";
        Long n = jdbc.queryForObject(sql, params, Long.class);
        return n != null && n > 0;
    }

    private static String blankToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static BigDecimal parseTabn(String tabn) {
        if (!StringUtils.hasText(tabn)) {
            return null;
        }
        try {
            return new BigDecimal(tabn.trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tabn must be numeric");
        }
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }
}
