package burnar.service;

import burnar.dto.ThematicCatalogNodeDto;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Read-only каталог тематических разделов с ACL основного MDI-сценария Delphi.
 * SQL одним recursive-запросом получает все разрешённые корни и их полные поддеревья.
 */
@Service
public class ThematicCatalogService {

    /**
     * Цепочка ACL повторяет MainUnit.qrShowTemRazdel:
     * активные должности пользователя → его оргединицы → подчинённые по sysboss → корни каталога.
     * UNION в catalog_nodes устраняет повторы, если один ACL-корень уже входит в другой.
     */
    private static final String CATALOG_SQL = """
            WITH RECURSIVE
            user_orgs(id) AS (
                SELECT DISTINCT ds.org
                FROM burnar.users u
                INNER JOIN burnar.karjera k ON k.idpeople = u.people_id
                INNER JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru
                WHERE UPPER(u.ora_name) = UPPER(:username)
                  AND k.dtenter <= NOW()
                  AND k.dtout >= NOW()
            ),
            org_scope(id) AS (
                SELECT o.id
                FROM burnar.org_stru o
                WHERE o.id IN (SELECT id FROM user_orgs)
                UNION
                SELECT child.id
                FROM burnar.org_stru child
                INNER JOIN org_scope parent_org ON parent_org.id = child.sysboss
            ),
            acl_roots(id) AS (
                SELECT DISTINCT access.tem_cat_id
                FROM burnar.org_stru_tem_cat access
                WHERE access.org_id IN (SELECT id FROM org_scope)
            ),
            catalog_nodes(id, parent_id, nm, oper, ord, nartype) AS (
                SELECT t.id, t.parent_id, t.nm, t.oper, t.ord, t.nartype
                FROM public.tematic_razdel t
                WHERE t.id IN (SELECT id FROM acl_roots)
                UNION
                SELECT child.id, child.parent_id, child.nm, child.oper, child.ord, child.nartype
                FROM public.tematic_razdel child
                INNER JOIN catalog_nodes parent_node ON parent_node.id = child.parent_id
            )
            SELECT node.id,
                   node.parent_id,
                   CASE WHEN node.oper IS NULL THEN node.nm ELSE operation.nm END AS name,
                   node.oper,
                   node.ord,
                   node.nartype
            FROM catalog_nodes node
            LEFT JOIN public.spr_oper operation ON operation.key = node.oper
            """;

    private static final Comparator<ThematicCatalogNodeDto> NODE_ORDER =
            Comparator.comparing(
                            ThematicCatalogNodeDto::getOrd,
                            Comparator.nullsLast(Integer::compareTo))
                    .thenComparing(
                            ThematicCatalogNodeDto::getId,
                            Comparator.nullsLast(Integer::compareTo));

    private static final RowMapper<ThematicCatalogNodeDto> ROW_MAPPER = (rs, rowNum) ->
            new ThematicCatalogNodeDto(
                    nullableInteger(rs, "id"),
                    nullableInteger(rs, "parent_id"),
                    rs.getString("name"),
                    nullableInteger(rs, "oper"),
                    nullableInteger(rs, "ord"),
                    nullableInteger(rs, "nartype"));

    private final NamedParameterJdbcTemplate jdbc;

    public ThematicCatalogService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Возвращает несколько вложенных корней каталога. При отсутствии аутентификации
     * или разрешённых разделов контрактом является пустой массив, а не ошибка/null.
     */
    public List<ThematicCatalogNodeDto> findTree() {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            return List.of();
        }

        List<ThematicCatalogNodeDto> flatNodes = jdbc.query(
                CATALOG_SQL,
                new MapSqlParameterSource("username", username.trim()),
                ROW_MAPPER);
        return buildTree(flatNodes);
    }

    /**
     * Собирает eager-дерево из плоской выборки. Отсутствующий в выборке parent означает корень:
     * так вложенный ACL-корень не дублируется рядом с уже разрешённым предком.
     */
    static List<ThematicCatalogNodeDto> buildTree(List<ThematicCatalogNodeDto> flatNodes) {
        if (flatNodes == null || flatNodes.isEmpty()) {
            return List.of();
        }

        Map<Integer, ThematicCatalogNodeDto> uniqueNodes = new LinkedHashMap<>();
        for (ThematicCatalogNodeDto node : flatNodes) {
            if (node == null || node.getId() == null) {
                continue;
            }
            uniqueNodes.putIfAbsent(node.getId(), node);
        }

        // Сбрасываем возможное состояние DTO: сборщик является единственным владельцем children.
        for (ThematicCatalogNodeDto node : uniqueNodes.values()) {
            node.setChildren(new ArrayList<>());
            node.setHasChildren(false);
        }

        List<ThematicCatalogNodeDto> roots = new ArrayList<>();
        for (ThematicCatalogNodeDto node : uniqueNodes.values()) {
            ThematicCatalogNodeDto parent = uniqueNodes.get(node.getParentId());
            if (parent == null || parent == node) {
                roots.add(node);
            } else {
                parent.getChildren().add(node);
            }
        }

        // Сортируем на каждом уровне, чтобы JSON не зависел от порядка строк JDBC.
        for (ThematicCatalogNodeDto node : uniqueNodes.values()) {
            node.getChildren().sort(NODE_ORDER);
            node.setHasChildren(!node.getChildren().isEmpty());
        }
        roots.sort(NODE_ORDER);
        return roots;
    }

    private static String currentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return authentication.getName();
    }

    private static Integer nullableInteger(ResultSet rs, String column) throws SQLException {
        Number value = (Number) rs.getObject(column);
        return value == null ? null : value.intValue();
    }
}
