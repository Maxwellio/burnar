package burnar.service;

import burnar.dto.NaryadDurationTotalsDto;
import burnar.dto.NaryadOperNodeDto;
import burnar.dto.NaryadWorkActionDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * Ленивое дерево работ, итоги продолжительности и признак кнопок строки.
 * SQL как Delphi qrNarZad / qrNarVip. Доступ — через {@link NaryadListService#findHeader(int)}.
 */
@Service
public class NaryadOperTreeService {

    static final String TREE_ROOTS_WHERE = "WHERE tmp.parent IS NULL ";
    static final String TREE_CHILDREN_WHERE = "WHERE tmp.parent = :parentId ";

    private static final String RS_SQL =
            "(WITH vars(npi) AS ("
                    + "  VALUES (ARRAY[13555,13556,13557,13558,13559,13560,13561,13562,13563,13564,13565,13566])"
                    + ") SELECT CASE WHEN tmp.razdel = ANY(npi) THEN '1' ELSE '0' END FROM vars) AS rs";

    static final String ZADANIE_TREE_SQL =
            "WITH RECURSIVE tmp AS ("
                    + "  SELECT o.*, "
                    + "         ARRAY[(row_number() OVER (PARTITION BY o.parent ORDER BY o.prnum))::integer] AS ord2, "
                    + "         CAST(o.prnum AS varchar(100)) AS path "
                    + "  FROM burnar.zadanie_oper o "
                    + "  WHERE o.parent IS NULL AND o.narkey = :narkey "
                    + "  UNION ALL "
                    + "  SELECT o.*, "
                    + "         (tmp.ord2 || ARRAY[(row_number() OVER (PARTITION BY o.parent ORDER BY o.prnum))::integer]) AS ord2, "
                    + "         CAST(tmp.path || '.' || o.prnum AS varchar(100)) "
                    + "  FROM tmp "
                    + "  INNER JOIN burnar.zadanie_oper o ON tmp.key = o.parent "
                    + ") "
                    + "SELECT tmp.key AS id, tmp.parent AS parent_id, tmp.prnum, tmp.path AS ord, "
                    + "CASE WHEN tmp.oper IS NOT NULL THEN "
                    + "  (SELECT s.nm FROM public.spr_oper s WHERE s.key = tmp.oper) "
                    + "ELSE (SELECT a.nm FROM burnar.zadanie_anynm a WHERE a.zad_key = tmp.key) END AS nm, "
                    + "tmp.begoperdate, "
                    + "burnar.zadanie_GetOperIst(tmp.key) AS istnorm, "
                    + "tmp.oper, p_ot.znach AS ot, p_do.znach AS do_, "
                    + RS_SQL + ", "
                    + "CASE WHEN tmp.operlifetype IS NOT NULL THEN "
                    + "  (SELECT round(y.norma / 60, 2) FROM burnar.zadanie_norm y "
                    + "   WHERE y.zad_key = tmp.key AND y.prnum = 1) END AS n1, "
                    + "CASE WHEN tmp.operlifetype IS NOT NULL THEN "
                    + "  (SELECT round(y.norma / 60, 2) FROM burnar.zadanie_norm y "
                    + "   WHERE y.zad_key = tmp.key AND y.prnum = 2) END AS n2, "
                    + "tmp.operlifeid, tmp.operlifetype, tmp.colorsel, tmp.locked, tmp.narkey, "
                    + "(SELECT t.name_short FROM burnar.spr_eks t WHERE t.id = tmp.tipbur) AS tipbur, "
                    + "EXISTS (SELECT 1 FROM burnar.zadanie_oper c WHERE c.parent = tmp.key) AS has_children "
                    + "FROM tmp "
                    + "LEFT JOIN ( "
                    + "  SELECT * FROM burnar.zadanie_param ttt "
                    + "  WHERE ttt.zad_key IN (SELECT z.key FROM burnar.zadanie_oper z WHERE z.narkey = :narkey) "
                    + "    AND ttt.parcode IN (SELECT * FROM burnar.ot_params) "
                    + ") p_ot ON tmp.key = p_ot.zad_key "
                    + "LEFT JOIN ( "
                    + "  SELECT * FROM burnar.zadanie_param ttt "
                    + "  WHERE ttt.zad_key IN (SELECT z.key FROM burnar.zadanie_oper z WHERE z.narkey = :narkey) "
                    + "    AND ttt.parcode IN (SELECT * FROM burnar.do_params) "
                    + ") p_do ON tmp.key = p_do.zad_key "
                    + "%s";

    static final String VIPOLNENIE_TREE_SQL =
            "WITH RECURSIVE tmp AS ("
                    + "  SELECT o.*, "
                    + "         ARRAY[(row_number() OVER (PARTITION BY o.parent ORDER BY o.prnum))::integer] AS ord2, "
                    + "         CAST(o.prnum AS varchar(100)) AS path "
                    + "  FROM burnar.vipolnenie_oper o "
                    + "  WHERE o.parent IS NULL AND o.narkey = :narkey "
                    + "  UNION ALL "
                    + "  SELECT o.*, "
                    + "         (tmp.ord2 || ARRAY[(row_number() OVER (PARTITION BY o.parent ORDER BY o.prnum))::integer]) AS ord2, "
                    + "         CAST(tmp.path || '.' || o.prnum "
                    + "              || CASE tmp.priznak WHEN 1 THEN 'Д' ELSE '' END AS varchar(100)) "
                    + "  FROM tmp "
                    + "  INNER JOIN burnar.vipolnenie_oper o ON tmp.key = o.parent "
                    + ") "
                    + "SELECT tmp.key AS id, tmp.parent AS parent_id, tmp.prnum, tmp.path AS ord, "
                    + "CASE WHEN tmp.oper IS NOT NULL THEN "
                    + "  (SELECT s.nm FROM public.spr_oper s WHERE s.key = tmp.oper) "
                    + "ELSE (SELECT a.nm FROM burnar.vipolnenie_anynm a WHERE a.vip_key = tmp.key) END AS nm, "
                    + "tmp.begoperdate, "
                    + "burnar.vipolnenie_GetOperIst(tmp.key) AS istnorm, "
                    + "tmp.oper, p_ot.znach AS ot, p_do.znach AS do_, "
                    + RS_SQL + ", "
                    + "CASE WHEN tmp.operlifetype IS NOT NULL THEN "
                    + "  (SELECT round(y.norma / 60, 2) FROM burnar.vipolnenie_norm y "
                    + "   WHERE y.vip_key = tmp.key AND y.prnum = 1) END AS n1, "
                    + "CASE WHEN tmp.operlifetype IS NOT NULL THEN "
                    + "  (SELECT round(y.norma / 60, 2) FROM burnar.vipolnenie_norm y "
                    + "   WHERE y.vip_key = tmp.key AND y.prnum = 2) END AS n2, "
                    + "tmp.operlifeid, tmp.operlifetype, tmp.colorsel, tmp.locked, tmp.narkey, "
                    + "CASE WHEN tmp.operlifetype IS NOT NULL THEN "
                    + "  (SELECT round(y.fact / 60, 2) FROM burnar.vipolnenie_norm y "
                    + "   WHERE y.vip_key = tmp.key AND y.prnum = 2) END AS fact, "
                    + "CASE WHEN tmp.operlifetype IS NOT NULL THEN "
                    + "  (SELECT 1 FROM burnar.factkorr fr WHERE fr.idlife = tmp.operlifeid) END AS kor, "
                    + "CASE WHEN tmp.period IS NOT NULL THEN "
                    + "  (SELECT nm || ' (' || to_char(begoperdate, 'dd.mm.yyyy') || ' - ' "
                    + "          || to_char(outoperdate, 'dd.mm.yyyy') || ')' "
                    + "   FROM burnar.vipolnenie_period pp WHERE pp.key = tmp.period) END AS period_nm, "
                    + "(SELECT t.name_short FROM burnar.spr_eks t WHERE t.id = tmp.tipbur) AS tipbur, "
                    + "tmp.priznak, "
                    + "EXISTS (SELECT 1 FROM burnar.vipolnenie_oper c WHERE c.parent = tmp.key) AS has_children "
                    + "FROM tmp "
                    + "LEFT JOIN ( "
                    + "  SELECT * FROM burnar.vipolnenie_param ttt "
                    + "  WHERE ttt.vip_key IN (SELECT z.key FROM burnar.vipolnenie_oper z WHERE z.narkey = :narkey) "
                    + "    AND ttt.parcode IN (SELECT * FROM burnar.ot_params) "
                    + ") p_ot ON tmp.key = p_ot.vip_key "
                    + "LEFT JOIN ( "
                    + "  SELECT * FROM burnar.vipolnenie_param ttt "
                    + "  WHERE ttt.vip_key IN (SELECT z.key FROM burnar.vipolnenie_oper z WHERE z.narkey = :narkey) "
                    + "    AND ttt.parcode IN (SELECT * FROM burnar.do_params) "
                    + ") p_do ON tmp.key = p_do.vip_key "
                    + "%s";

    /** Листья задания: своя n2 родителя в сумму не входит, как CalcItogsNS. */
    static final String ZADANIE_TOTAL_SQL =
            "SELECT COALESCE(SUM(leaf.n2), 0) FROM ("
                    + "  SELECT CASE WHEN o.operlifetype IS NOT NULL THEN "
                    + "    (SELECT round(y.norma / 60, 2) FROM burnar.zadanie_norm y "
                    + "     WHERE y.zad_key = o.key AND y.prnum = 2) END AS n2 "
                    + "  FROM burnar.zadanie_oper o "
                    + "  WHERE o.narkey = :narkey "
                    + "    AND NOT EXISTS (SELECT 1 FROM burnar.zadanie_oper c WHERE c.parent = o.key)"
                    + ") leaf";

    static final String VIPOLNENIE_NORM_TOTAL_SQL =
            "SELECT COALESCE(SUM(leaf.n2), 0) FROM ("
                    + "  SELECT CASE WHEN o.operlifetype IS NOT NULL THEN "
                    + "    (SELECT round(y.norma / 60, 2) FROM burnar.vipolnenie_norm y "
                    + "     WHERE y.vip_key = o.key AND y.prnum = 2) END AS n2 "
                    + "  FROM burnar.vipolnenie_oper o "
                    + "  WHERE o.narkey = :narkey "
                    + "    AND NOT EXISTS (SELECT 1 FROM burnar.vipolnenie_oper c WHERE c.parent = o.key)"
                    + ") leaf";

    static final String VIPOLNENIE_FACT_TOTAL_SQL =
            "SELECT COALESCE(SUM(leaf.fact), 0) FROM ("
                    + "  SELECT CASE WHEN o.operlifetype IS NOT NULL THEN "
                    + "    (SELECT round(y.fact / 60, 2) FROM burnar.vipolnenie_norm y "
                    + "     WHERE y.vip_key = o.key AND y.prnum = 2) END AS fact "
                    + "  FROM burnar.vipolnenie_oper o "
                    + "  WHERE o.narkey = :narkey "
                    + "    AND NOT EXISTS (SELECT 1 FROM burnar.vipolnenie_oper c WHERE c.parent = o.key)"
                    + ") leaf";

    private static final String WORK_RS_SQL =
            "(WITH vars(npi) AS ("
                    + "  VALUES (ARRAY[13555,13556,13557,13558,13559,13560,13561,13562,13563,13564,13565,13566])"
                    + ") SELECT CASE WHEN o.razdel = ANY(npi) THEN '1' ELSE '0' END FROM vars)";

    static final String ZADANIE_WORK_ROWS_SQL =
            "SELECT o.key AS id, o.parent AS parent_id, o.prnum, o.operlifetype, o.locked, "
                    + WORK_RS_SQL + " AS rs FROM burnar.zadanie_oper o "
                    + "WHERE o.narkey = :narkey AND o.key IN (:nodeIds)";

    static final String VIPOLNENIE_WORK_ROWS_SQL =
            "SELECT o.key AS id, o.parent AS parent_id, o.prnum, o.operlifetype, o.locked, "
                    + WORK_RS_SQL + " AS rs FROM burnar.vipolnenie_oper o "
                    + "WHERE o.narkey = :narkey AND o.key IN (:nodeIds)";

    static final String ZADANIE_HAS_ROOTS_SQL =
            "SELECT EXISTS (SELECT 1 FROM burnar.zadanie_oper o "
                    + "WHERE o.narkey = :narkey AND o.parent IS NULL)";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;

    public NaryadOperTreeService(NamedParameterJdbcTemplate jdbc, NaryadListService naryadListService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
    }

    public List<NaryadOperNodeDto> findZadanieRoots(int naryadId) {
        naryadListService.findHeader(naryadId);
        return queryTree(ZADANIE_TREE_SQL, naryadId, null, false);
    }

    public List<NaryadOperNodeDto> findZadanieChildren(int naryadId, long parentId) {
        naryadListService.findHeader(naryadId);
        return queryTree(ZADANIE_TREE_SQL, naryadId, parentId, false);
    }

    public List<NaryadOperNodeDto> findVipolnenieRoots(int naryadId) {
        naryadListService.findHeader(naryadId);
        return queryTree(VIPOLNENIE_TREE_SQL, naryadId, null, true);
    }

    public List<NaryadOperNodeDto> findVipolnenieChildren(int naryadId, long parentId) {
        naryadListService.findHeader(naryadId);
        return queryTree(VIPOLNENIE_TREE_SQL, naryadId, parentId, true);
    }

    public NaryadDurationTotalsDto zadanieTotals(int naryadId) {
        naryadListService.findHeader(naryadId);
        NaryadDurationTotalsDto dto = new NaryadDurationTotalsDto();
        dto.setDuration(sumHours(ZADANIE_TOTAL_SQL, naryadId));
        dto.setHasRoots(hasZadanieRoots(naryadId));
        return dto;
    }

    public NaryadDurationTotalsDto vipolnenieTotals(int naryadId) {
        naryadListService.findHeader(naryadId);
        NaryadDurationTotalsDto dto = new NaryadDurationTotalsDto();
        dto.setNormDuration(sumHours(VIPOLNENIE_NORM_TOTAL_SQL, naryadId));
        dto.setFactDuration(sumHours(VIPOLNENIE_FACT_TOTAL_SQL, naryadId));
        return dto;
    }

    public NaryadWorkActionDto zadanieWorkAction(int naryadId, long nodeId) {
        return workAction(naryadId, nodeId, false, "burnar.zadanie_oper");
    }

    public NaryadWorkActionDto vipolnenieWorkAction(int naryadId, long nodeId) {
        return workAction(naryadId, nodeId, true, "burnar.vipolnenie_oper");
    }

    boolean hasZadanieRoots(int naryadId) {
        Boolean exists = jdbc.queryForObject(
                ZADANIE_HAS_ROOTS_SQL,
                new MapSqlParameterSource("narkey", naryadId),
                Boolean.class);
        return Boolean.TRUE.equals(exists);
    }

    /** {@code vipolnenie = true} читает burnar.vipolnenie_oper. */
    List<NaryadWorkDeletion.Node> loadWorkNodes(boolean vipolnenie, int naryadId, List<Long> nodeIds) {
        String sql = vipolnenie ? VIPOLNENIE_WORK_ROWS_SQL : ZADANIE_WORK_ROWS_SQL;
        return jdbc.query(
                sql,
                new MapSqlParameterSource("narkey", naryadId).addValue("nodeIds", nodeIds),
                (rs, rowNum) -> new NaryadWorkDeletion.Node(
                        rs.getLong("id"),
                        getLong(rs, "parent_id"),
                        rs.getBigDecimal("prnum"),
                        getInteger(rs, "operlifetype"),
                        getInteger(rs, "locked"),
                        rs.getString("rs")));
    }

    private NaryadWorkActionDto workAction(
            int naryadId, long nodeId, boolean vipolnenie, String childrenTable) {
        naryadListService.findHeader(naryadId);
        List<NaryadWorkDeletion.Node> nodes = loadWorkNodes(vipolnenie, naryadId, List.of(nodeId));
        if (nodes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        NaryadWorkDeletion.Node node = nodes.get(0);
        Boolean hasChildren = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM " + childrenTable + " c WHERE c.parent = :nodeId)",
                new MapSqlParameterSource("nodeId", nodeId),
                Boolean.class);
        return new NaryadWorkActionDto(
                node.id, node.operlifetype, node.locked, node.rs, Boolean.TRUE.equals(hasChildren));
    }

    private BigDecimal sumHours(String sql, int naryadId) {
        BigDecimal sum = jdbc.queryForObject(sql, new MapSqlParameterSource("narkey", naryadId), BigDecimal.class);
        return sum == null ? BigDecimal.ZERO : sum;
    }

    private List<NaryadOperNodeDto> queryTree(
            String sqlTemplate, int naryadId, Long parentId, boolean vip) {
        String levelWhere = parentId == null ? TREE_ROOTS_WHERE : TREE_CHILDREN_WHERE;
        String sql = String.format(sqlTemplate, levelWhere) + "ORDER BY ord2 ";
        MapSqlParameterSource params = new MapSqlParameterSource("narkey", naryadId);
        if (parentId != null) {
            params.addValue("parentId", parentId);
        }
        return jdbc.query(sql, params, (rs, rowNum) -> mapNode(rs, vip));
    }

    private static NaryadOperNodeDto mapNode(ResultSet rs, boolean vip) throws SQLException {
        NaryadOperNodeDto dto = new NaryadOperNodeDto();
        dto.setId(getLong(rs, "id"));
        dto.setParentId(getLong(rs, "parent_id"));
        dto.setPrnum(rs.getBigDecimal("prnum"));
        dto.setOrd(rs.getString("ord"));
        dto.setNm(rs.getString("nm"));
        dto.setBegoperdate(NaryadOperFormat.formatBegoperdate(rs.getTimestamp("begoperdate")));
        dto.setIstnorm(rs.getString("istnorm"));
        dto.setOper(getInteger(rs, "oper"));
        dto.setOt(rs.getBigDecimal("ot"));
        dto.setDo_(rs.getBigDecimal("do_"));
        dto.setN1(rs.getBigDecimal("n1"));
        dto.setN2(rs.getBigDecimal("n2"));
        dto.setOperlifeid(getInteger(rs, "operlifeid"));
        dto.setOperlifetype(getInteger(rs, "operlifetype"));
        dto.setColorsel(getInteger(rs, "colorsel"));
        dto.setLocked(getInteger(rs, "locked"));
        dto.setNarkey(getInteger(rs, "narkey"));
        dto.setTipbur(rs.getString("tipbur"));
        dto.setRs(rs.getString("rs"));
        dto.setHasChildren(rs.getBoolean("has_children"));
        if (vip) {
            dto.setFact(rs.getBigDecimal("fact"));
            dto.setKor(getInteger(rs, "kor"));
            dto.setPeriodNm(rs.getString("period_nm"));
            dto.setPriznak(getInteger(rs, "priznak"));
        }
        return dto;
    }

    private static Integer getInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static Long getLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }
}
