package burnar.service;

import burnar.dto.ThematicCatalogNodeDto;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Полный тематический каталог для MDI-сценария formStructNur.
 * ACL начинается с оргединицы текущего пользователя, а дерево собирается в памяти
 * из одной отсортированной SQL-выборки для передачи клиенту готовых children.
 */
@Service
public class ThematicCatalogService {

    /**
     * org_stru_tem_cat задаёт ACL-корни, не технический rootId клиента.
     * Если ACL содержит системный раздел 1, его не отдаём: его прямые дети становятся
     * корнями ответа, сохраняя доступ к каталогу без отображения системного узла.
     */
    private static final String CATALOG_SQL =
            "WITH RECURSIVE user_orgs(id) AS ( "
                    + "  SELECT ds.org "
                    + "  FROM burnar.users u "
                    + "  JOIN burnar.karjera k ON k.idpeople = u.people_id "
                    + "  JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                    + "  WHERE UPPER(u.ora_name) = UPPER(:username) "
                    + "    AND k.dtenter <= CURRENT_DATE "
                    + "    AND k.dtout >= CURRENT_DATE "
                    + "  UNION "
                    + "  SELECT child.id "
                    + "  FROM burnar.org_stru child "
                    + "  JOIN user_orgs parent ON parent.id = child.sysboss "
                    + "), acl_roots AS ( "
                    + "  SELECT DISTINCT acl.tem_cat_id "
                    + "  FROM burnar.org_stru_tem_cat acl "
                    + "  JOIN user_orgs org ON org.id = acl.org_id "
                    + "), effective_roots AS ( "
                    + "  SELECT tem_cat_id AS id FROM acl_roots WHERE tem_cat_id <> 1 "
                    + "  UNION "
                    + "  SELECT section.id "
                    + "  FROM public.tematic_razdel section "
                    + "  JOIN acl_roots acl ON acl.tem_cat_id = 1 "
                    + "  WHERE section.parent_id = 1 "
                    + "), ancestor_chain(root_id, parent_id) AS ( "
                    + "  SELECT root.id, section.parent_id "
                    + "  FROM effective_roots root "
                    + "  JOIN public.tematic_razdel section ON section.id = root.id "
                    + "  UNION "
                    + "  SELECT chain.root_id, section.parent_id "
                    + "  FROM ancestor_chain chain "
                    + "  JOIN public.tematic_razdel section ON section.id = chain.parent_id "
                    + "), top_roots AS ( "
                    + "  SELECT root.id "
                    + "  FROM effective_roots root "
                    + "  WHERE NOT EXISTS ( "
                    + "    SELECT 1 "
                    + "    FROM ancestor_chain chain "
                    + "    JOIN effective_roots ancestor ON ancestor.id = chain.parent_id "
                    + "    WHERE chain.root_id = root.id "
                    + "  ) "
                    + "), tree(id, parent_id, name, oper_key, ord, nar_type, root_id, ord_path) AS ( "
                    + "  SELECT section.id, section.parent_id, "
                    + "         CASE WHEN section.oper IS NULL THEN section.nm ELSE operation.nm END, "
                    + "         section.oper, section.ord, section.nartype, root.id, "
                    + "         ARRAY[COALESCE(section.ord, 0)::integer] "
                    + "  FROM public.tematic_razdel section "
                    + "  JOIN top_roots root ON root.id = section.id "
                    + "  LEFT JOIN public.spr_oper operation ON operation.key = section.oper "
                    + "  UNION ALL "
                    + "  SELECT section.id, section.parent_id, "
                    + "         CASE WHEN section.oper IS NULL THEN section.nm ELSE operation.nm END, "
                    + "         section.oper, section.ord, section.nartype, tree.root_id, "
                    + "         tree.ord_path || COALESCE(section.ord, 0)::integer "
                    + "  FROM public.tematic_razdel section "
                    + "  JOIN tree ON tree.id = section.parent_id "
                    + "  LEFT JOIN public.spr_oper operation ON operation.key = section.oper "
                    + ") "
                    + "SELECT id, parent_id, name, oper_key, ord, nar_type, "
                    + "       id = root_id AS is_root "
                    + "FROM tree "
                    + "ORDER BY ord_path";

    private final NamedParameterJdbcTemplate jdbc;

    public ThematicCatalogService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Возвращает только разрешённые ACL-корни и их потомков.
     * Неаутентифицированный контекст и пустой ACL одинаково безопасно дают пустой массив.
     */
    public List<ThematicCatalogNodeDto> getCatalog() {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            return Collections.emptyList();
        }

        List<CatalogRow> rows = jdbc.query(
                CATALOG_SQL,
                new MapSqlParameterSource("username", username),
                (rs, rowNum) -> new CatalogRow(
                        createNode(
                                rs.getInt("id"),
                                rs.getObject("parent_id", Integer.class),
                                rs.getString("name"),
                                rs.getObject("oper_key", Integer.class),
                                rs.getObject("ord", Integer.class),
                                rs.getObject("nar_type", Integer.class)),
                        rs.getBoolean("is_root")));

        List<ThematicCatalogNodeDto> nodes = new ArrayList<>(rows.size());
        Set<Integer> rootIds = new LinkedHashSet<>();
        for (CatalogRow row : rows) {
            nodes.add(row.node());
            if (row.root()) {
                rootIds.add(row.node().getId());
            }
        }
        return buildTree(nodes, rootIds);
    }

    // SQL уже упорядочен по ord_path; LinkedHashMap сохраняет этот порядок для siblings.
    static List<ThematicCatalogNodeDto> buildTree(
            List<ThematicCatalogNodeDto> nodes,
            Set<Integer> rootIds) {
        if (nodes.isEmpty() || rootIds.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Integer, ThematicCatalogNodeDto> byId = new LinkedHashMap<>();
        for (ThematicCatalogNodeDto node : nodes) {
            node.setChildren(new ArrayList<>());
            node.setHasChildren(false);
            byId.put(node.getId(), node);
        }

        List<ThematicCatalogNodeDto> roots = new ArrayList<>();
        for (ThematicCatalogNodeDto node : nodes) {
            if (rootIds.contains(node.getId())) {
                roots.add(node);
                continue;
            }
            ThematicCatalogNodeDto parent = byId.get(node.getParentId());
            if (parent != null) {
                parent.getChildren().add(node);
                parent.setHasChildren(true);
            }
        }
        return roots;
    }

    private static ThematicCatalogNodeDto createNode(
            Integer id,
            Integer parentId,
            String name,
            Integer operKey,
            Integer ord,
            Integer narType) {
        ThematicCatalogNodeDto node = new ThematicCatalogNodeDto();
        node.setId(id);
        node.setParentId(parentId);
        node.setName(name);
        node.setOperKey(operKey);
        node.setOrd(ord);
        node.setNarType(narType);
        return node;
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }

    private record CatalogRow(ThematicCatalogNodeDto node, boolean root) {
    }
}
