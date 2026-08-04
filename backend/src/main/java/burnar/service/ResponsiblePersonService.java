package burnar.service;

import burnar.dto.CareerDto;
import burnar.dto.ResponsiblePersonDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * Read-API ответственных лиц (Delphi formUsersDoljn): список people + карьеры.
 * ACL — parent-поддерево через OrgAccessService; orgUnitId учитывается только у админа.
 * Write (people_add / karjera_add) — см. docs/responsible-persons-crud-notes.md.
 */
@Service
public class ResponsiblePersonService {

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

    private final NamedParameterJdbcTemplate jdbc;
    private final OrgAccessService orgAccessService;

    public ResponsiblePersonService(NamedParameterJdbcTemplate jdbc, OrgAccessService orgAccessService) {
        this.jdbc = jdbc;
        this.orgAccessService = orgAccessService;
    }

    /**
     * Pageable-список людей с карьерой в ACL-поддереве (как strUser в Delphi без чекбоксов).
     * DISTINCT — у человека может быть несколько строк karjera в том же поддереве.
     */
    public Page<ResponsiblePersonDto> findPeople(Pageable pageable, Integer orgUnitId) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        String username = currentUsername();
        if (!orgAccessService.appendOrgParentSubtreeFilter(
                where, params, username, orgUnitId, "ds.org")) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

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

    /** Тот же ACL, что у списка: нельзя подсмотреть карьеры человека вне своего поддерева. */
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

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }
}
