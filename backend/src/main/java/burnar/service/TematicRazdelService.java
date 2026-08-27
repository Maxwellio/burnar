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
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Дерево public.tematic_razdel для BaseTreeTable (Delphi formStructNur / tbtnStructNarsClick).
 * Корни не-админа — org_stru_tem_cat по sysboss-поддереву карьеры (qrShowTemRazdel),
 * обрезанные до поддерева id=2; админ — узел id=2, иначе parent_id IS NULL.
 * Дети без повторного фильтра каталога, но parent должен лежать в видимом лесу
 * (для админа — только поддерево id=2).
 */
@Service
public class TematicRazdelService {

    /** Видимый корень каталога (не id=1 «всё дерево»). */
    static final int CATALOG_ROOT_ID = 2;

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

    /** Предки catalog root включая его самого (1 → 2). */
    private static final String ANCESTOR_IDS_SQL =
            "WITH RECURSIVE anc AS ("
                    + "  SELECT t.id, t.parent_id FROM public.tematic_razdel t WHERE t.id = :rootId "
                    + "  UNION ALL "
                    + "  SELECT p.id, p.parent_id FROM public.tematic_razdel p "
                    + "  INNER JOIN anc a ON a.parent_id = p.id"
                    + ") SELECT anc.id FROM anc";

    /** Поддерево catalog root включая его самого. */
    private static final String SUBTREE_IDS_SQL =
            "WITH RECURSIVE sub AS ("
                    + "  SELECT t.id FROM public.tematic_razdel t WHERE t.id = :rootId "
                    + "  UNION ALL "
                    + "  SELECT c.id FROM public.tematic_razdel c "
                    + "  INNER JOIN sub s ON c.parent_id = s.id"
                    + ") SELECT sub.id FROM sub";

    private static final String FOREST_FROM_ROOTS_SQL =
            "WITH RECURSIVE forest AS ("
                    + "  SELECT tr.id FROM public.tematic_razdel tr WHERE tr.id IN (:rootIds) "
                    + "  UNION ALL "
                    + "  SELECT c.id FROM public.tematic_razdel c "
                    + "  INNER JOIN forest f ON c.parent_id = f.id"
                    + ") ";

    private static final Comparator<TematicRazdelNodeDto> NODE_ORDER_CMP =
            Comparator.comparing(TematicRazdelNodeDto::getOrd, Comparator.nullsFirst(Integer::compareTo))
                    .thenComparing(TematicRazdelNodeDto::getId, Comparator.nullsLast(Integer::compareTo));

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

    /** Корни дерева: админ — id=2 / null-parent; иначе org_stru_tem_cat, обрезанные до id=2.
     *  При непустых фильтрах — вложенный лес совпадений (предки сохранены). */
    public List<TematicRazdelNodeDto> findRoots(String idPrefix, String nameSubstr, String operPrefix) {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            return Collections.emptyList();
        }
        List<Integer> rootIds = resolveRootIds(username);
        if (rootIds.isEmpty()) {
            return Collections.emptyList();
        }
        if (!hasFilters(idPrefix, nameSubstr, operPrefix)) {
            MapSqlParameterSource params = new MapSqlParameterSource("rootIds", rootIds);
            return queryNodes("WHERE t.id IN (:rootIds) ", params);
        }
        return nestFiltered(queryForest(rootIds), rootIds, idPrefix, nameSubstr, operPrefix);
    }

    /**
     * Дети parentId. Не-админу — только если parent в лесу от обрезанных корней
     * (прямым URL чужую ветку не отдаём). Админу — только поддерево id=2.
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

    private List<Integer> resolveRootIds(String username) {
        if (orgAccessService.isAdmin(username)) {
            MapSqlParameterSource rootParams =
                    new MapSqlParameterSource("rootId", CATALOG_ROOT_ID);
            List<TematicRazdelNodeDto> fromCatalogRoot = queryNodes("WHERE t.id = :rootId ", rootParams);
            if (!fromCatalogRoot.isEmpty()) {
                return List.of(CATALOG_ROOT_ID);
            }
            return queryNodes("WHERE t.parent_id IS NULL ", new MapSqlParameterSource()).stream()
                    .map(TematicRazdelNodeDto::getId)
                    .filter(Objects::nonNull)
                    .toList();
        }
        return clipUserRootIds(username);
    }

    private List<TematicRazdelNodeDto> queryForest(List<Integer> rootIds) {
        MapSqlParameterSource params = new MapSqlParameterSource("rootIds", rootIds);
        return jdbc.query(
                FOREST_FROM_ROOTS_SQL + NODE_SELECT + "WHERE t.id IN (SELECT forest.id FROM forest) " + NODE_ORDER,
                params,
                MAPPER);
    }

    private static boolean hasFilters(String idPrefix, String nameSubstr, String operPrefix) {
        return StringUtils.hasText(idPrefix) || StringUtils.hasText(nameSubstr) || StringUtils.hasText(operPrefix);
    }

    static boolean matches(
            TematicRazdelNodeDto node, String idPrefix, String nameSubstr, String operPrefix) {
        if (StringUtils.hasText(idPrefix)) {
            String idText = node.getId() == null ? "" : String.valueOf(node.getId());
            if (!idText.startsWith(idPrefix.trim())) {
                return false;
            }
        }
        if (StringUtils.hasText(nameSubstr)) {
            String name = node.getName() == null ? "" : node.getName();
            if (!name.toLowerCase(Locale.ROOT).contains(nameSubstr.trim().toLowerCase(Locale.ROOT))) {
                return false;
            }
        }
        if (StringUtils.hasText(operPrefix)) {
            if (node.getOper() == null) {
                return false;
            }
            if (!String.valueOf(node.getOper()).startsWith(operPrefix.trim())) {
                return false;
            }
        }
        return true;
    }

    /**
     * Оставляет совпадения и их предков, собирает вложенный лес от rootIds.
     * Дети сортируются как в SQL: ord NULLS FIRST, id.
     */
    static List<TematicRazdelNodeDto> nestFiltered(
            List<TematicRazdelNodeDto> all,
            List<Integer> rootIds,
            String idPrefix,
            String nameSubstr,
            String operPrefix) {
        if (all == null || all.isEmpty() || rootIds == null || rootIds.isEmpty()) {
            return List.of();
        }
        Map<Integer, TematicRazdelNodeDto> byId = new HashMap<>();
        for (TematicRazdelNodeDto node : all) {
            if (node.getId() != null) {
                byId.put(node.getId(), node);
                node.setChildren(new ArrayList<>());
            }
        }
        Set<Integer> keep = new HashSet<>();
        for (TematicRazdelNodeDto node : all) {
            if (!matches(node, idPrefix, nameSubstr, operPrefix) || node.getId() == null) {
                continue;
            }
            Integer walk = node.getId();
            while (walk != null && keep.add(walk)) {
                TematicRazdelNodeDto current = byId.get(walk);
                if (current == null) {
                    break;
                }
                walk = current.getParentId();
            }
        }
        for (TematicRazdelNodeDto node : all) {
            if (node.getId() == null || !keep.contains(node.getId())) {
                continue;
            }
            Integer parentId = node.getParentId();
            if (parentId != null && keep.contains(parentId) && byId.containsKey(parentId)) {
                byId.get(parentId).getChildren().add(node);
            }
        }
        for (TematicRazdelNodeDto node : all) {
            if (node.getChildren() == null) {
                continue;
            }
            node.getChildren().sort(NODE_ORDER_CMP);
            node.setHasChildren(!node.getChildren().isEmpty());
            if (node.getChildren().isEmpty()) {
                node.setChildren(null);
            }
        }
        List<TematicRazdelNodeDto> roots = new ArrayList<>();
        for (Integer rootId : rootIds) {
            if (rootId != null && keep.contains(rootId) && byId.containsKey(rootId)) {
                roots.add(byId.get(rootId));
            }
        }
        roots.sort(NODE_ORDER_CMP);
        return roots;
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

    private List<Integer> clipUserRootIds(String username) {
        List<Integer> aclRoots = findAllowedRootIds(username);
        if (aclRoots.isEmpty()) {
            return List.of();
        }
        return clipAclRoots(
                aclRoots,
                queryIdSet(ANCESTOR_IDS_SQL, CATALOG_ROOT_ID),
                queryIdSet(SUBTREE_IDS_SQL, CATALOG_ROOT_ID));
    }

    private Set<Integer> queryIdSet(String sql, int rootId) {
        return jdbc.query(
                        sql,
                        new MapSqlParameterSource("rootId", rootId),
                        (rs, rowNum) -> getInteger(rs, "id"))
                .stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private boolean isParentVisible(String username, int parentId) {
        if (orgAccessService.isAdmin(username)) {
            return queryIdSet(SUBTREE_IDS_SQL, CATALOG_ROOT_ID).contains(parentId);
        }
        List<Integer> rootIds = clipUserRootIds(username);
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

    /**
     * Предок или сам корень → один корень {@link #CATALOG_ROOT_ID}.
     * Потомки сохраняются (порядок и уникальность). Узлы вне поддерева отбрасываются.
     */
    static List<Integer> clipAclRoots(
            List<Integer> aclRoots, Set<Integer> ancestorsOfRoot, Set<Integer> subtreeOfRoot) {
        if (aclRoots == null || aclRoots.isEmpty()) {
            return List.of();
        }
        Set<Integer> ancestors = ancestorsOfRoot == null ? Set.of() : ancestorsOfRoot;
        Set<Integer> subtree = subtreeOfRoot == null ? Set.of() : subtreeOfRoot;
        LinkedHashSet<Integer> descendants = new LinkedHashSet<>();
        boolean seesWholeSubtree = false;
        for (Integer id : aclRoots) {
            if (id == null) {
                continue;
            }
            if (ancestors.contains(id)) {
                seesWholeSubtree = true;
            } else if (subtree.contains(id)) {
                descendants.add(id);
            }
        }
        if (seesWholeSubtree) {
            return List.of(CATALOG_ROOT_ID);
        }
        return List.copyOf(descendants);
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
