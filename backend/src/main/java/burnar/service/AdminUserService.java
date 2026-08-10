package burnar.service;

import burnar.dto.AdminUserDetailDto;
import burnar.dto.AdminUserDto;
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

import java.util.Collections;
import java.util.List;

/**
 * Read-API админ-панели пользователей (Delphi formUsersDoljn, учётки).
 * Список/карточка people + LEFT JOIN users; карьеры — через ResponsiblePersonService.
 * Подробности и будущий CRUD — docs/admin-panel-notes.md.
 */
@Service
public class AdminUserService {

    /** Тот же FROM, что у списка ответственных лиц (strUser без чекбоксов). */
    private static final String PEOPLE_FROM =
            "FROM burnar.karjera k "
                    + "JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                    + "JOIN burnar.people p ON p.id = k.idpeople "
                    + "LEFT JOIN burnar.users u ON u.people_id = p.id ";

    private static final String USER_SELECT =
            "p.id, "
                    + "u.users_id, "
                    + "p.fio, "
                    + "u.ora_name, "
                    + "u.active, "
                    + "to_char(u.dtenter, 'YYYY-MM-DD') AS dtenter, "
                    + "to_char(u.dtout, 'YYYY-MM-DD') AS dtout, "
                    + "u.note ";

    private static final RowMapper<AdminUserDto> LIST_MAPPER = (rs, rowNum) -> {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(rs.getInt("id"));
        dto.setUsersId((Integer) rs.getObject("users_id"));
        dto.setFio(rs.getString("fio"));
        dto.setOraName(rs.getString("ora_name"));
        Number active = (Number) rs.getObject("active");
        dto.setActive(active == null ? null : active.intValue());
        dto.setDtEnter(rs.getString("dtenter"));
        dto.setDtOut(rs.getString("dtout"));
        dto.setNote(rs.getString("note"));
        return dto;
    };

    private static final RowMapper<AdminUserDetailDto> DETAIL_MAPPER = (rs, rowNum) -> {
        AdminUserDetailDto dto = new AdminUserDetailDto();
        dto.setId(rs.getInt("id"));
        dto.setUsersId((Integer) rs.getObject("users_id"));
        dto.setFio(rs.getString("fio"));
        dto.setOraName(rs.getString("ora_name"));
        Number active = (Number) rs.getObject("active");
        dto.setActive(active == null ? null : active.intValue());
        dto.setDtEnter(rs.getString("dtenter"));
        dto.setDtOut(rs.getString("dtout"));
        dto.setNote(rs.getString("note"));
        return dto;
    };

    private final NamedParameterJdbcTemplate jdbc;
    private final OrgAccessService orgAccessService;

    public AdminUserService(NamedParameterJdbcTemplate jdbc, OrgAccessService orgAccessService) {
        this.jdbc = jdbc;
        this.orgAccessService = orgAccessService;
    }

    /**
     * Pageable-список людей с полями учётки (как admin-grid Delphi).
     * Колоночные фильтры BaseTable: id, fio, oraName, note.
     */
    public Page<AdminUserDto> findUsers(
            Pageable pageable,
            String id,
            String fio,
            String oraName,
            String note) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        String username = currentUsername();
        if (!orgAccessService.appendOrgParentSubtreeFilter(
                where, params, username, null, "ds.org")) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        appendTextFilter(where, params, "id", id,
                "CAST(p.id AS varchar) ILIKE CONCAT(:id, '%')");
        appendTextFilter(where, params, "fio", fio,
                "p.fio ILIKE CONCAT('%', :fio, '%')");
        appendTextFilter(where, params, "oraName", oraName,
                "u.ora_name ILIKE CONCAT('%', :oraName, '%')");
        appendTextFilter(where, params, "note", note,
                "u.note ILIKE CONCAT('%', :note, '%')");

        String countSql = "SELECT COUNT(*) FROM ("
                + "SELECT DISTINCT p.id " + PEOPLE_FROM + where
                + ") t";
        Long total = jdbc.queryForObject(countSql, params, Long.class);
        if (total == null) {
            total = 0L;
        }

        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());

        String listSql = "SELECT DISTINCT " + USER_SELECT
                + PEOPLE_FROM + where
                + "ORDER BY p.fio "
                + "LIMIT :limit OFFSET :offset";
        List<AdminUserDto> content = jdbc.query(listSql, params, LIST_MAPPER);
        return new PageImpl<>(content, pageable, total);
    }

    /** Карточка для формы справа; 404 если человек вне ACL. */
    public AdminUserDetailDto getUser(int peopleId) {
        if (!isPersonVisible(peopleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        List<AdminUserDetailDto> rows = jdbc.query(
                "SELECT " + USER_SELECT
                        + "FROM burnar.people p "
                        + "LEFT JOIN burnar.users u ON u.people_id = p.id "
                        + "WHERE p.id = :id",
                new MapSqlParameterSource("id", peopleId),
                DETAIL_MAPPER);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return rows.get(0);
    }

    private boolean isPersonVisible(int peopleId) {
        MapSqlParameterSource params = new MapSqlParameterSource("peopleId", peopleId);
        StringBuilder where = new StringBuilder("WHERE p.id = :peopleId ");
        String username = currentUsername();
        if (!orgAccessService.appendOrgParentSubtreeFilter(
                where, params, username, null, "ds.org")) {
            return false;
        }
        String sql = "SELECT COUNT(*) FROM ("
                + "SELECT DISTINCT p.id " + PEOPLE_FROM + where
                + ") t";
        Long n = jdbc.queryForObject(sql, params, Long.class);
        return n != null && n > 0;
    }

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

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }
}
