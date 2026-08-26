package burnar.service;

import burnar.dto.TematicRazdelNodeDto;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Дерево public.tematic_razdel для BaseTreeTable (Delphi formStructNur / tbtnStructNarsClick).
 * Корни не-админа — org_stru_tem_cat по sysboss-поддереву карьеры (qrShowTemRazdel);
 * админ — узел id=1 («все»), иначе parent_id IS NULL. Дети без повторного ACL по каталогу,
 * но parent должен лежать в видимом лесу (иначе пустой список).
 */
@Service
public class TematicRazdelService {

    /** Поля узла: имя раздела или spr_oper.nm, если это операция. */
    private static final String NODE_SELECT =
            "SELECT t.id, "
                    + "CASE WHEN t.oper IS NULL THEN t.nm ELSE s.nm END AS nm, "
                    + "t.oper, t.parent_id, t.ord, t.nartype, "
                    + "EXISTS (SELECT 1 FROM public.tematic_razdel c WHERE c.parent_id = t.id) "
                    + "AS has_children "
                    + "FROM public.tematic_razdel t "
                    + "LEFT JOIN public.spr_oper s ON t.oper = s.key ";

    private static final String NODE_ORDER = "ORDER BY t.ord NULLS FIRST, t.id ";

    /**
     * Разрешённые корни каталога: tem_cat_id для орг. в sysboss-поддереве
     * текущей карьеры пользователя (MainUnit.dfm qrShowTemRazdel).
     */
    private static final String ALLOWED_ROOT_IDS_SQL =
            "SELECT t.tem_cat_id FROM burnar.org_stru_tem_cat t "
                    + "WHERE t.org_id IN ("
                    + "  WITH RECURSIVE tmp AS ("
                    + "    SELECT o.id FROM burnar.org_stru o "
                    + "    WHERE o.id IN ("
                    + "      SELECT ds.org FROM burnar.karjera k "
                    + "      JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                    + "      JOIN burnar.users u ON k.idpeople = u.people_id "
                    + "      WHERE UPPER(u.ora_name) = UPPER(:username) "
                    + "        AND k.dtenter <= now() "
                    + "        AND k.dtout >= now()"
                    + "    ) "
                    + "    UNION "
                    + "    SELECT o2.id FROM burnar.org_stru o2 "
                    + "    INNER JOIN tmp ON tmp.id = o2.sysboss"
                    + "  ) "
                    + "  SELECT tmp.id FROM tmp"
                    + ")";

    private static final RowMapper<TematicRazdelNodeDto> MAPPER = (rs, rowNum) -> {
        TematicRazdelNodeDto dto = new TematicRazdelNodeDto();
        dto.setId(getInteger(rs, "id"));
        dto.setName(rs.getString("nm"));
        dto.setOper(getInteger(rs, "oper"));
        dto.setParentId(getInteger(rs, "parent_id"));
        dto.setOrd(getInteger(rs, "ord"));
        dto.setNartype(getInteger(rs, "nartype"));
        dto.setHasChildren(rs.getBoolean("has_children"));
        return dto;
    };

    private final NamedParameterJdbcTemplate jdbc;
    private final OrgAccessService orgAccessService;

    public TematicRazdelService(NamedParameterJdbcTemplate jdbc, OrgAccessService orgAccessService) {
        this.jdbc = jdbc;
        this.orgAccessService = orgAccessService;
    }

    /** Корни дерева: админ — id=1 / null-parent; иначе org_stru_tem_cat. */
    public List<TematicRazdelNodeDto> findRoots() {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            return Collections.emptyList();
        }
        if (orgAccessService.isAdmin(username)) {
            List<TematicRazdelNodeDto> fromAll = queryNodes("WHERE t.id = 1 ", new MapSqlParameterSource());
            if (!fromAll.isEmpty()) {
                return fromAll;
            }
            return queryNodes("WHERE t.parent_id IS NULL ", new MapSqlParameterSource());
        }
        List<Integer> rootIds = findAllowedRootIds(username);
        if (rootIds.isEmpty()) {
            return Collections.emptyList();
        }
        MapSqlParameterSource params = new MapSqlParameterSource("rootIds", rootIds);
        return queryNodes("WHERE t.id IN (:rootIds) ", params);
    }

    /**
     * Дети parentId. Не-админу — только если parent в лесу от разрешённых корней
     * (прямым URL чужую ветку не отдаём).
     */
    public List<TematicRazdelNodeDto> findChildren(int parentId) {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            return Collections.emptyList();
        }
        if (!isParentVisible(username, parentId)) {
            return Collections.emptyList();
        }
        MapSqlParameterSource params = new MapSqlParameterSource("parentId", parentId);
        return queryNodes("WHERE t.parent_id = :parentId ", params);
    }

    private List<TematicRazdelNodeDto> queryNodes(String where, MapSqlParameterSource params) {
        return jdbc.query(NODE_SELECT + where + NODE_ORDER, params, MAPPER);
    }

    private List<Integer> findAllowedRootIds(String username) {
        return jdbc.query(
                ALLOWED_ROOT_IDS_SQL,
                new MapSqlParameterSource("username", username),
                (rs, rowNum) -> getInteger(rs, "tem_cat_id"))
                .stream()
                .filter(Objects::nonNull)
                .toList();
    }

    private boolean isParentVisible(String username, int parentId) {
        if (orgAccessService.isAdmin(username)) {
            return true;
        }
        List<Integer> rootIds = findAllowedRootIds(username);
        if (rootIds.isEmpty()) {
            return false;
        }
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("rootIds", rootIds);
        params.addValue("parentId", parentId);
        Integer count = jdbc.queryForObject(
                "WITH RECURSIVE forest AS ("
                        + "  SELECT tr.id FROM public.tematic_razdel tr WHERE tr.id IN (:rootIds) "
                        + "  UNION ALL "
                        + "  SELECT c.id FROM public.tematic_razdel c "
                        + "  INNER JOIN forest f ON c.parent_id = f.id"
                        + ") SELECT COUNT(*) FROM forest WHERE id = :parentId",
                params,
                Integer.class);
        return count != null && count > 0;
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }

    private static Integer getInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }
}
