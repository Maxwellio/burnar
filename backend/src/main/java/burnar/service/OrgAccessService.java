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
 * ACL по оргструктуре: sysboss-поддерево для авторов нарядов;
 * parent-поддерево для списка ответственных лиц (formUsersDoljn).
 * resolveUserOrgId / isAdmin / listFilterOrgUnits — общие для обеих страниц.
 */
@Service
public class OrgAccessService {

    /**
     * Карьера автора наряда для ACL: как Delphi NarListUnit — только dtenter &lt;= now,
     * без фильтра dtout. Наряд остаётся в выборке и при уже закрытой должности автора.
     * Фрагмент внутри EXISTS; снаружи уже есть users u (автор наряда).
     */
    private static final String AUTHOR_CAREER_FROM =
            "FROM burnar.karjera k "
                    + "JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                    + "WHERE k.idpeople = u.people_id "
                    + "AND k.dtenter <= CURRENT_DATE ";

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
     * Орг. единица текущего пользователя (корень sysboss-дерева для не-админа).
     * При нескольких активных должностях — самая свежая по dtenter.
     */
    public Optional<Integer> resolveUserOrgId(String username) {
        if (!StringUtils.hasText(username)) {
            return Optional.empty();
        }
        List<Integer> orgs = jdbc.query(
                "SELECT ds.org AS org "
                        + "FROM burnar.users u "
                        + "JOIN burnar.karjera k ON k.idpeople = u.people_id "
                        + "JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                        + "WHERE UPPER(u.ora_name) = UPPER(:username) "
                        + "AND k.dtenter <= CURRENT_DATE "
                        + "AND k.dtout >= CURRENT_DATE "
                        + "ORDER BY k.dtenter DESC, ds.org "
                        + "LIMIT 1",
                new MapSqlParameterSource("username", username.trim()),
                (rs, rowNum) -> rs.getInt("org"));
        return orgs.isEmpty() ? Optional.empty() : Optional.of(orgs.get(0));
    }

    /**
     * Дописывает ACL в WHERE списка/дерева (users u уже в FROM как автор наряда).
     * Админ без orgUnitId («Все») — без ограничения. Админ с cut — точное совпадение орг. автора.
     * Не-админ — sysboss-поддерево своей орг.; нет карьеры у текущего пользователя → AND 1=0.
     * У автора наряда закрытая карьера (dtout в прошлом) не скрывает наряд.
     */
    public void appendAuthorOrgAcl(
            StringBuilder where,
            MapSqlParameterSource params,
            String username,
            Integer orgUnitId) {
        // Админ: «Все» = весь список; cut = только выбранная орг. автора (не поддерево).
        if (isAdmin(username)) {
            if (orgUnitId == null) {
                return;
            }
            params.addValue("aclOrgUnitId", orgUnitId);
            where.append("AND EXISTS (SELECT 1 ")
                    .append(AUTHOR_CAREER_FROM)
                    .append("AND ds.org = :aclOrgUnitId) ");
            return;
        }

        Optional<Integer> userOrg = resolveUserOrgId(username);
        if (userOrg.isEmpty()) {
            where.append("AND 1=0 ");
            return;
        }
        params.addValue("aclUserOrgId", userOrg.get());

        where.append("AND EXISTS (SELECT 1 ")
                .append(AUTHOR_CAREER_FROM)
                .append("AND ds.org IN (")
                .append("WITH RECURSIVE tr AS (")
                .append("  SELECT c.id FROM burnar.org_stru c WHERE c.id = :aclUserOrgId ")
                .append("  UNION ALL ")
                .append("  SELECT c.id FROM burnar.org_stru c ")
                .append("  INNER JOIN tr ON c.sysboss = tr.id")
                .append(") SELECT tr.id FROM tr")
                .append(")) ");
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

    /**
     * ACL списка ответственных лиц (formUsersDoljn): поддерево по org_stru.parent.
     * Не-админ — корень = resolveUserOrgId; админ без orgUnitId — без ограничения;
     * админ с cut — parent-поддерево выбранного СП.
     * {@code orgColumnExpr} — SQL-выражение колонки орг. (например {@code ds.org}).
     *
     * @return false если список должен быть пустым (нет карьеры у не-админа / нет сессии)
     */
    public boolean appendOrgParentSubtreeFilter(
            StringBuilder where,
            MapSqlParameterSource params,
            String username,
            Integer orgUnitId,
            String orgColumnExpr) {
        if (!StringUtils.hasText(username)) {
            where.append("AND 1=0 ");
            return false;
        }

        Integer rootOrg;
        if (isAdmin(username)) {
            if (orgUnitId == null) {
                return true;
            }
            rootOrg = orgUnitId;
        } else {
            Optional<Integer> userOrg = resolveUserOrgId(username);
            if (userOrg.isEmpty()) {
                where.append("AND 1=0 ");
                return false;
            }
            rootOrg = userOrg.get();
        }

        params.addValue("aclParentRootOrgId", rootOrg);
        where.append("AND ").append(orgColumnExpr).append(" IN (")
                .append("WITH RECURSIVE tr AS (")
                .append("  SELECT c.id FROM burnar.org_stru c WHERE c.id = :aclParentRootOrgId ")
                .append("  UNION ALL ")
                .append("  SELECT c.id FROM burnar.org_stru c ")
                .append("  INNER JOIN tr ON c.parent = tr.id")
                .append(") SELECT tr.id FROM tr")
                .append(") ");
        return true;
    }
}
