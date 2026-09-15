package burnar.service;

import burnar.dto.NaryadAlgorithmDto;
import burnar.dto.NaryadOperNodeDto;
import burnar.dto.NaryadOperParamDto;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Дерево работ, параметры операции и текст алгоритма карточки наряда.
 * SQL как Delphi qrNarZad / qrNarVip / qrParamZ / qrParamV / qrAlgInfo;
 * ACL — через {@link NaryadListService#findHeader(int)}.
 */
@Service
public class NaryadWorkspaceService {

    static final int OPERTYPE_COMBINATION = 79;
    static final int OPERTYPE_ALGORITHM = 80;

    static final String TREE_ROOTS_WHERE = "WHERE tmp.parent IS NULL ";
    static final String TREE_CHILDREN_WHERE = "WHERE tmp.parent = :parentId ";

    private static final DateTimeFormatter DATE_ONLY = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

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

    static final String ZADANIE_PARAMS_SQL =
            "SELECT p.zad_key, p.parcode, "
                    + "coalesce(up.nm, '') || coalesce(CASE e.znach "
                    + "  WHEN NULL THEN '' ELSE ', ' || e.znach END, '') AS nm, "
                    + "up.type AS ptype, "
                    + "round(p.znach) AS znach_code, "
                    + "coalesce((SELECT CASE "
                    + "            WHEN p.znach = coalesce(zn.val, "
                    + "              (SELECT q.normparorzn FROM public.common_spr q WHERE q.id = zn.znval)) "
                    + "            THEN 14811101 ELSE 11777023 END "
                    + "          FROM burnar.zndefnarzadatrib zn, public.common_spr c "
                    + "          WHERE zn.defnar = :narkey "
                    + "            AND zn.parcode = c.id "
                    + "            AND c.normparorzn IS NOT NULL "
                    + "            AND c.normparorzn = p.parcode), 0) AS isskv, "
                    + "CASE up.type "
                    + "  WHEN 1 THEN trim(to_char(to_number(replace(p.znach::text, '.', ','), '999999D999'), "
                    + "                           'FM99999990D99'), ',') "
                    + "  WHEN 2 THEN (SELECT zp.znach FROM public.zn_dparam zp WHERE zp.key = round(p.znach)) "
                    + "END AS val "
                    + "FROM burnar.zadanie_param p, "
                    + "     public.user_param up LEFT JOIN public.spr_edizm e ON e.key = up.edizm, "
                    + "     (SELECT ss.prnum, ss.key FROM ("
                    + "        SELECT t.prnum AS prnum, t.param AS key "
                    + "        FROM public.comboperparam t WHERE t.operlifeid = :aoperlifeid "
                    + "        UNION ALL "
                    + "        SELECT ap.prnum AS prnum, ap.userparam AS key "
                    + "        FROM public.alguserparam ap, public.alg_operlife t "
                    + "        WHERE t.id_operlife = :aoperlifeid AND ap.alg = t.alg"
                    + "     ) ss) ap "
                    + "WHERE p.zad_key = :zadkey "
                    + "  AND p.parcode = up.key "
                    + "  AND ap.key = up.key "
                    + "ORDER BY ap.prnum";

    static final String VIPOLNENIE_PARAMS_SQL =
            "SELECT p.vip_key, p.parcode, "
                    + "coalesce(up.nm, '') || coalesce(CASE e.znach "
                    + "  WHEN NULL THEN '' ELSE ', ' || e.znach END, '') AS nm, "
                    + "up.type AS ptype, "
                    + "round(p.znach) AS znach_code, "
                    + "coalesce((SELECT CASE "
                    + "            WHEN p.znach = coalesce(zn.val, "
                    + "              (SELECT q.normparorzn FROM public.common_spr q WHERE q.id = zn.znval)) "
                    + "            THEN 14811101 ELSE 11777023 END "
                    + "          FROM burnar.zndefnarvipatrib zn, public.common_spr c "
                    + "          WHERE zn.defnar = :narkey "
                    + "            AND zn.parcode = c.id "
                    + "            AND c.normparorzn IS NOT NULL "
                    + "            AND c.normparorzn = p.parcode), 0) AS isskv, "
                    + "CASE up.type "
                    + "  WHEN 1 THEN trim(to_char(to_number(replace(p.znach::text, '.', ','), '999999D999'), "
                    + "                           'FM99999990D99'), ',') "
                    + "  WHEN 2 THEN (SELECT zp.znach FROM public.zn_dparam zp WHERE zp.key = round(p.znach)) "
                    + "END AS val "
                    + "FROM burnar.vipolnenie_param p, "
                    + "     public.user_param up LEFT JOIN public.spr_edizm e ON e.key = up.edizm, "
                    + "     (SELECT ss.prnum, ss.key FROM ("
                    + "        SELECT t.prnum AS prnum, t.param AS key "
                    + "        FROM public.comboperparam t WHERE t.operlifeid = :aoperlifeid "
                    + "        UNION ALL "
                    + "        SELECT ap.prnum AS prnum, ap.userparam AS key "
                    + "        FROM public.alguserparam ap, public.alg_operlife t "
                    + "        WHERE t.id_operlife = :aoperlifeid AND ap.alg = t.alg"
                    + "     ) ss) ap "
                    + "WHERE p.vip_key = :vipkey "
                    + "  AND p.parcode = up.key "
                    + "  AND ap.key = up.key "
                    + "ORDER BY ap.prnum";

    static final String ALGORITHM_SQL =
            "SELECT a.ops FROM public.operlife o, public.alg_operlife ao, public.algs a "
                    + "WHERE o.id = :oplife AND ao.id_operlife = o.id AND ao.alg = a.key";

    private static final String ZADANIE_OPER_REF_SQL =
            "SELECT operlifeid, operlifetype FROM burnar.zadanie_oper "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    private static final String VIPOLNENIE_OPER_REF_SQL =
            "SELECT operlifeid, operlifetype FROM burnar.vipolnenie_oper "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    private static final RowMapper<NaryadOperParamDto> PARAM_MAPPER = (rs, rowNum) -> {
        NaryadOperParamDto dto = new NaryadOperParamDto();
        dto.setNm(rs.getString("nm"));
        dto.setVal(rs.getString("val"));
        dto.setPtype(getInteger(rs, "ptype"));
        dto.setParcode(rs.getBigDecimal("parcode"));
        dto.setZnachCode(rs.getBigDecimal("znach_code"));
        dto.setIsSkv(getInteger(rs, "isskv"));
        return dto;
    };

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;

    public NaryadWorkspaceService(
            NamedParameterJdbcTemplate jdbc, NaryadListService naryadListService) {
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

    public List<NaryadOperParamDto> findZadanieParams(int naryadId, Long nodeId) {
        naryadListService.findHeader(naryadId);
        OperRef ref = loadOperRef(ZADANIE_OPER_REF_SQL, naryadId, nodeId);
        if (ref == null || !loadsParams(ref.operlifetype)) {
            return List.of();
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("zadkey", nodeId)
                .addValue("aoperlifeid", ref.operlifeid);
        return jdbc.query(ZADANIE_PARAMS_SQL, params, PARAM_MAPPER);
    }

    public List<NaryadOperParamDto> findVipolnenieParams(int naryadId, Long nodeId) {
        naryadListService.findHeader(naryadId);
        OperRef ref = loadOperRef(VIPOLNENIE_OPER_REF_SQL, naryadId, nodeId);
        if (ref == null || !loadsParams(ref.operlifetype)) {
            return List.of();
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("vipkey", nodeId)
                .addValue("aoperlifeid", ref.operlifeid);
        return jdbc.query(VIPOLNENIE_PARAMS_SQL, params, PARAM_MAPPER);
    }

    public NaryadAlgorithmDto findZadanieAlgorithm(int naryadId, Long nodeId) {
        return findAlgorithm(naryadId, nodeId, ZADANIE_OPER_REF_SQL);
    }

    public NaryadAlgorithmDto findVipolnenieAlgorithm(int naryadId, Long nodeId) {
        return findAlgorithm(naryadId, nodeId, VIPOLNENIE_OPER_REF_SQL);
    }

    static boolean loadsParams(Integer operlifetype) {
        return operlifetype != null
                && (operlifetype == OPERTYPE_COMBINATION || operlifetype == OPERTYPE_ALGORITHM);
    }

    static boolean loadsAlgorithm(Integer operlifetype) {
        return operlifetype != null && operlifetype == OPERTYPE_ALGORITHM;
    }

    /**
     * Delphi: дата без времени, если часы и минуты нулевые; иначе dd.mm.yyyy HH:mm.
     */
    static String formatBegoperdate(Timestamp value) {
        if (value == null) {
            return null;
        }
        LocalDateTime local = value.toLocalDateTime();
        if (local.getHour() == 0 && local.getMinute() == 0) {
            return local.format(DATE_ONLY);
        }
        return local.format(DATE_TIME);
    }

    private NaryadAlgorithmDto findAlgorithm(int naryadId, Long nodeId, String refSql) {
        naryadListService.findHeader(naryadId);
        OperRef ref = loadOperRef(refSql, naryadId, nodeId);
        if (ref == null || !loadsAlgorithm(ref.operlifetype) || ref.operlifeid == null) {
            return NaryadAlgorithmDto.empty();
        }
        List<String> rows = jdbc.query(
                ALGORITHM_SQL,
                new MapSqlParameterSource("oplife", ref.operlifeid),
                (rs, rowNum) -> rs.getString("ops"));
        if (rows.isEmpty() || rows.get(0) == null) {
            return NaryadAlgorithmDto.empty();
        }
        return new NaryadAlgorithmDto(rows.get(0));
    }

    private OperRef loadOperRef(String sql, int naryadId, Long nodeId) {
        if (nodeId == null) {
            return null;
        }
        List<OperRef> rows = jdbc.query(
                sql,
                new MapSqlParameterSource()
                        .addValue("narkey", naryadId)
                        .addValue("nodeId", nodeId),
                (rs, rowNum) -> new OperRef(getInteger(rs, "operlifeid"), getInteger(rs, "operlifetype")));
        return rows.isEmpty() ? null : rows.get(0);
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
        dto.setBegoperdate(formatBegoperdate(rs.getTimestamp("begoperdate")));
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

    private static final class OperRef {
        final Integer operlifeid;
        final Integer operlifetype;

        OperRef(Integer operlifeid, Integer operlifetype) {
            this.operlifeid = operlifeid;
            this.operlifetype = operlifetype;
        }
    }
}
