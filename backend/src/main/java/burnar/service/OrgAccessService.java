package burnar.service;

import burnar.config.BurnarProperties;
import burnar.dto.OrgUnitDto;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Переиспользуемый доступ по оргструктуре (burnar.org_stru.sysboss).
 * ACL автора наряда — как Delphi NarListUnit.BitBtn2Click.
 */
@Service
public class OrgAccessService {

    /**
     * Join орг. автора: users u уже в FROM; алиас userstru.org — для ACL.
     * Как в Delphi: karjera.dtenter &lt;= now, без фильтра dtout.
     */
    public static final String AUTHOR_ORG_JOIN_SQL =
            "LEFT JOIN ("
                    + "  SELECT ds.org, k.idpeople "
                    + "  FROM burnar.karjera k, burnar.doljtostruct ds "
                    + "  WHERE k.dtenter <= CURRENT_DATE AND ds.key = k.doljinstru"
                    + ") userstru ON u.people_id = userstru.idpeople ";

    private final NamedParameterJdbcTemplate jdbc;
    private final BurnarProperties properties;
    private final Set<String> adminUsersLower;

    public OrgAccessService(NamedParameterJdbcTemplate jdbc, BurnarProperties properties) {
        this.jdbc = jdbc;
        this.properties = properties;
        this.adminUsersLower = properties.getAdminUsers().stream()
                .filter(StringUtils::hasText)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }

    public boolean isAdmin(String username) {
        if (!StringUtils.hasText(username)) {
            return false;
        }
        return adminUsersLower.contains(username.toLowerCase(Locale.ROOT));
    }

    /**
     * Орг. единица пользователя через карьеру. При нескольких distinct — первая.
     */
    public Optional<Integer> resolveUserOrgId(String username) {
        if (!StringUtils.hasText(username)) {
            return Optional.empty();
        }
        List<Integer> orgs = jdbc.query(
                "SELECT DISTINCT ds.org AS org "
                        + "FROM burnar.users u "
                        + "JOIN burnar.karjera k ON k.idpeople = u.people_id "
                        + "JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                        + "WHERE UPPER(u.ora_name) = UPPER(:username) "
                        + "AND k.dtenter <= CURRENT_DATE "
                        + "ORDER BY ds.org "
                        + "LIMIT 1",
                new MapSqlParameterSource("username", username.trim()),
                (rs, rowNum) -> rs.getInt("org"));
        return orgs.isEmpty() ? Optional.empty() : Optional.of(orgs.get(0));
    }

    /**
     * Добавляет AND userstru.org IN (sysboss-дерево пользователя [с обрезкой orgUnitId]).
     * orgUnitId учитывается только для админа; иначе игнорируется.
     * Нет орг. у пользователя → AND 1=0 (пустая выдача, без 500).
     */
    public void appendAuthorOrgAcl(
            StringBuilder where,
            MapSqlParameterSource params,
            String username,
            Integer orgUnitId) {
        Optional<Integer> userOrg = resolveUserOrgId(username);
        if (userOrg.isEmpty()) {
            where.append("AND 1=0 ");
            return;
        }
        params.addValue("aclUserOrgId", userOrg.get());

        Integer cutId = (orgUnitId != null && isAdmin(username)) ? orgUnitId : null;
        if (cutId != null) {
            params.addValue("aclOrgUnitId", cutId);
        }

        where.append("AND userstru.org IN (")
                .append("WITH RECURSIVE tr AS (")
                .append("  SELECT c.id FROM burnar.org_stru c WHERE c.id = :aclUserOrgId ")
                .append("  UNION ALL ")
                .append("  SELECT c.id FROM burnar.org_stru c ")
                .append("  INNER JOIN tr ON c.sysboss = tr.id")
                .append(") SELECT tr.id FROM tr");
        if (cutId != null) {
            where.append(" WHERE tr.id = :aclOrgUnitId");
        }
        where.append(") ");
    }

    /** Справочник для админского Select: id IN org-filter-ids, ORDER BY nm. */
    public List<OrgUnitDto> listFilterOrgUnits() {
        List<Integer> ids = properties.getOrgFilterIds();
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return jdbc.query(
                "SELECT id, nm FROM burnar.org_stru "
                        + "WHERE id IN (:ids) ORDER BY nm",
                new MapSqlParameterSource("ids", ids),
                (rs, rowNum) -> new OrgUnitDto(rs.getInt("id"), rs.getString("nm")));
    }
}
