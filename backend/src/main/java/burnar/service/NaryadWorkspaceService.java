package burnar.service;

import burnar.dto.NaryadAlgorithmDto;
import burnar.dto.NaryadClosedDto;
import burnar.dto.NaryadDurationTotalsDto;
import burnar.dto.NaryadLockTargetDto;
import burnar.dto.NaryadWorkActionDto;
import burnar.dto.NaryadWorkLockDto;
import burnar.dto.NaryadOperNodeDto;
import burnar.dto.NaryadOperParamDto;
import burnar.dto.NaryadRowColorDto;
import burnar.dto.NaryadRowsColorDto;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
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

    static final String ZADANIE_DESCRIPTOR_SQL =
            "SELECT closed FROM burnar.defnarzad WHERE narkey = :narkey FOR UPDATE";

    static final String VIPOLNENIE_DESCRIPTOR_SQL =
            "SELECT closed FROM burnar.defnarvip WHERE narkey = :narkey FOR UPDATE";

    static final String UPDATE_ZADANIE_COLOR_SQL =
            "UPDATE burnar.zadanie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    static final String UPDATE_VIPOLNENIE_COLOR_SQL =
            "UPDATE burnar.vipolnenie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    static final String UPDATE_ZADANIE_COLORS_SQL =
            "UPDATE burnar.zadanie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key IN (:nodeIds)";

    static final String UPDATE_VIPOLNENIE_COLORS_SQL =
            "UPDATE burnar.vipolnenie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key IN (:nodeIds)";

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

    static final String VIPOLNENIE_UNLOCKED_COUNT_SQL =
            "SELECT count(*) FROM burnar.vipolnenie_oper o "
                    + "WHERE o.locked = 0 AND o.narkey = :narkey";

    static final String OPEN_ZADANIE_SQL =
            "UPDATE burnar.defnarzad SET closed = 0 WHERE narkey = :narkey";

    static final String OPEN_VIPOLNENIE_SQL =
            "UPDATE burnar.defnarvip SET closed = 0 WHERE narkey = :narkey";

    static final String CLOSE_VIPOLNENIE_SQL =
            "UPDATE burnar.defnarvip SET closed = 1 WHERE narkey = :narkey";

    /**
     * Тот же обход, что у vipolnenie_lock_oper: родитель, затем дети по prnum.
     * Первая строка — самая ранняя, последняя — самая поздняя.
     */
    static final String VIPOLNENIE_SELECTION_ORDER_SQL =
            "WITH RECURSIVE walk AS ("
                    + "  SELECT vo.key, vo.locked, "
                    + "         ARRAY[(row_number() OVER (PARTITION BY vo.parent ORDER BY vo.prnum))::integer] AS ord "
                    + "  FROM burnar.vipolnenie_oper vo "
                    + "  WHERE vo.parent IS NULL AND vo.narkey = :narkey "
                    + "  UNION ALL "
                    + "  SELECT vo.key, vo.locked, "
                    + "         walk.ord || ARRAY[(row_number() OVER (PARTITION BY vo.parent ORDER BY vo.prnum))::integer] "
                    + "  FROM burnar.vipolnenie_oper vo "
                    + "  INNER JOIN walk ON walk.key = vo.parent"
                    + ") "
                    + "SELECT walk.key, walk.locked FROM walk "
                    + "WHERE walk.key IN (:nodeIds) "
                    + "ORDER BY walk.ord";

    /** Признак locked всех работ наряда. Кнопки смотрят в этот список, не в таблицу. */
    static final String VIPOLNENIE_LOCK_FLAGS_SQL =
            "SELECT o.key, o.locked FROM burnar.vipolnenie_oper o "
                    + "WHERE o.narkey = :narkey";

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

    static final String ZADANIE_WORK_EXISTS_SQL =
            "SELECT o.key FROM burnar.zadanie_oper o WHERE o.narkey = :narkey AND o.key = :nodeId";

    static final String VIPOLNENIE_WORK_EXISTS_SQL =
            "SELECT o.key FROM burnar.vipolnenie_oper o WHERE o.narkey = :narkey AND o.key = :nodeId";

    static final String ZADANIE_DELETE_WORK_SQL = "CALL burnar.zadanie_operac_del(?, ?, ?, ?)";
    static final String ZADANIE_DELETE_BLOCK_SQL = "CALL burnar.zadanie_operac_del_block(?, ?, ?, ?)";
    static final String VIPOLNENIE_DELETE_WORK_SQL = "CALL burnar.vipolnenie_operac_del(?, ?, ?, ?)";
    static final String VIPOLNENIE_DELETE_BLOCK_SQL = "CALL burnar.vipolnenie_operac_del_block(?, ?, ?, ?)";

    static final String NOT_ALL_LOCKED_MESSAGE = "Не все работы заблокированы!";

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

    @Transactional
    public NaryadRowColorDto updateZadanieColor(int naryadId, long nodeId, Integer color) {
        return updateColor(
                naryadId, nodeId, color, ZADANIE_DESCRIPTOR_SQL, UPDATE_ZADANIE_COLOR_SQL);
    }

    @Transactional
    public NaryadRowColorDto updateVipolnenieColor(int naryadId, long nodeId, Integer color) {
        return updateColor(
                naryadId, nodeId, color, VIPOLNENIE_DESCRIPTOR_SQL, UPDATE_VIPOLNENIE_COLOR_SQL);
    }

    @Transactional
    public NaryadRowsColorDto updateZadanieColors(int naryadId, Integer color, List<Long> nodeIds) {
        return updateColors(
                naryadId, color, nodeIds, ZADANIE_DESCRIPTOR_SQL, UPDATE_ZADANIE_COLORS_SQL);
    }

    @Transactional
    public NaryadRowsColorDto updateVipolnenieColors(int naryadId, Integer color, List<Long> nodeIds) {
        return updateColors(
                naryadId, color, nodeIds, VIPOLNENIE_DESCRIPTOR_SQL, UPDATE_VIPOLNENIE_COLORS_SQL);
    }

    public NaryadDurationTotalsDto zadanieTotals(int naryadId) {
        naryadListService.findHeader(naryadId);
        NaryadDurationTotalsDto dto = new NaryadDurationTotalsDto();
        dto.setDuration(sumHours(ZADANIE_TOTAL_SQL, naryadId));
        return dto;
    }

    public NaryadDurationTotalsDto vipolnenieTotals(int naryadId) {
        naryadListService.findHeader(naryadId);
        NaryadDurationTotalsDto dto = new NaryadDurationTotalsDto();
        dto.setNormDuration(sumHours(VIPOLNENIE_NORM_TOTAL_SQL, naryadId));
        dto.setFactDuration(sumHours(VIPOLNENIE_FACT_TOTAL_SQL, naryadId));
        return dto;
    }

    /**
     * Закрытие задания — burnar.zadanie_closenar. Закрытие выполнения — только когда
     * нет работ с locked = 0, затем defnarvip.closed = 1. Открытие — closed = 0.
     */
    public NaryadClosedDto setZadanieClosed(int naryadId, Boolean closed) {
        return setPartClosed(naryadId, closed, true);
    }

    public NaryadClosedDto setVipolnenieClosed(int naryadId, Boolean closed) {
        return setPartClosed(naryadId, closed, false);
    }

    /**
     * Один вызов процедуры по краю выделения в порядке обхода дерева.
     * Блокировка — самая поздняя выбранная, разблокировка — самая ранняя.
     */
    public NaryadLockTargetDto lockVipolnenie(int naryadId, List<Long> nodeIds) {
        return changeVipolnenieLock(naryadId, nodeIds, true);
    }

    public NaryadLockTargetDto unlockVipolnenie(int naryadId, List<Long> nodeIds) {
        return changeVipolnenieLock(naryadId, nodeIds, false);
    }

    public NaryadWorkActionDto zadanieWorkAction(int naryadId, long nodeId) {
        return workAction(naryadId, nodeId, ZADANIE_WORK_ROWS_SQL);
    }

    public NaryadWorkActionDto vipolnenieWorkAction(int naryadId, long nodeId) {
        return workAction(naryadId, nodeId, VIPOLNENIE_WORK_ROWS_SQL);
    }

    /** actDelSelOpers: burnar.zadanie_operac_del по выбранным, дети раньше родителей. */
    public List<Long> deleteZadanieWorks(int naryadId, List<Long> nodeIds) {
        return deleteWorks(
                naryadId,
                nodeIds,
                false,
                ZADANIE_DESCRIPTOR_SQL,
                ZADANIE_WORK_ROWS_SQL,
                ZADANIE_WORK_EXISTS_SQL,
                ZADANIE_DELETE_WORK_SQL,
                false);
    }

    /** actDelSelOpers выполнения: заблокированная строка отменяет весь набор. */
    public List<Long> deleteVipolnenieWorks(int naryadId, List<Long> nodeIds) {
        return deleteWorks(
                naryadId,
                nodeIds,
                true,
                VIPOLNENIE_DESCRIPTOR_SQL,
                VIPOLNENIE_WORK_ROWS_SQL,
                VIPOLNENIE_WORK_EXISTS_SQL,
                VIPOLNENIE_DELETE_WORK_SQL,
                true);
    }

    /** actZadanie_del_block: снять оболочку блока, вложенные работы поднять. */
    public void deleteZadanieBlock(int naryadId, long nodeId) {
        deleteBlock(
                naryadId,
                nodeId,
                ZADANIE_DESCRIPTOR_SQL,
                ZADANIE_WORK_ROWS_SQL,
                ZADANIE_DELETE_BLOCK_SQL,
                false);
    }

    /** actVipolnenie_del_block. */
    public void deleteVipolnenieBlock(int naryadId, long nodeId) {
        deleteBlock(
                naryadId,
                nodeId,
                VIPOLNENIE_DESCRIPTOR_SQL,
                VIPOLNENIE_WORK_ROWS_SQL,
                VIPOLNENIE_DELETE_BLOCK_SQL,
                true);
    }

    /** Признаки блокировки всех работ выполнения этого наряда. */
    public List<NaryadWorkLockDto> vipolnenieLockFlags(int naryadId) {
        naryadListService.findHeader(naryadId);
        return jdbc.query(
                VIPOLNENIE_LOCK_FLAGS_SQL,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> new NaryadWorkLockDto(getLong(rs, "key"), getInteger(rs, "locked")));
    }

    static List<Long> requireNodeIds(List<Long> nodeIds) {
        if (nodeIds == null || nodeIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeIds are required");
        }
        LinkedHashSet<Long> distinct = new LinkedHashSet<>();
        for (Long nodeId : nodeIds) {
            if (nodeId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeIds are required");
            }
            distinct.add(nodeId);
        }
        return List.copyOf(distinct);
    }

    static int requireValidColor(Integer color) {
        if (color == null || color < 0 || color > 0xFFFFFF) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Color must be between 0 and 16777215");
        }
        return color;
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

    private NaryadRowColorDto updateColor(
            int naryadId, long nodeId, Integer color, String descriptorSql, String updateSql) {
        naryadListService.findHeader(naryadId);
        int validColor = requireValidColor(color);
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("nodeId", nodeId)
                .addValue("color", validColor);
        List<Integer> descriptors = jdbc.query(
                descriptorSql, params, (rs, rowNum) -> rs.getInt("closed"));
        if (descriptors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        if (descriptors.get(0) == 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        if (jdbc.update(updateSql, params) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return new NaryadRowColorDto(nodeId, validColor);
    }

    private NaryadRowsColorDto updateColors(
            int naryadId,
            Integer color,
            List<Long> nodeIds,
            String descriptorSql,
            String updateSql) {
        naryadListService.findHeader(naryadId);
        int validColor = requireValidColor(color);
        List<Long> ids = requireNodeIds(nodeIds);
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("nodeIds", ids)
                .addValue("color", validColor);
        List<Integer> descriptors = jdbc.query(
                descriptorSql, params, (rs, rowNum) -> rs.getInt("closed"));
        if (descriptors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        if (descriptors.get(0) == 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        if (jdbc.update(updateSql, params) != ids.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return new NaryadRowsColorDto(validColor, ids);
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

    private NaryadClosedDto setPartClosed(int naryadId, Boolean closed, boolean zadanie) {
        naryadListService.findHeader(naryadId);
        if (closed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "closed is required");
        }
        String descriptorSql = zadanie ? ZADANIE_DESCRIPTOR_SQL : VIPOLNENIE_DESCRIPTOR_SQL;
        boolean alreadyClosed = readClosed(descriptorSql, naryadId);
        if (closed) {
            if (alreadyClosed) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
            }
            if (zadanie) {
                callProcedure("CALL burnar.zadanie_closenar(?)", naryadId, null);
            } else {
                closeVipolnenie(naryadId);
            }
            return new NaryadClosedDto(true);
        }
        String updateSql = zadanie ? OPEN_ZADANIE_SQL : OPEN_VIPOLNENIE_SQL;
        int updated = jdbc.update(updateSql, new MapSqlParameterSource("narkey", naryadId));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        return new NaryadClosedDto(false);
    }

    private void closeVipolnenie(int naryadId) {
        Long unlocked = jdbc.queryForObject(
                VIPOLNENIE_UNLOCKED_COUNT_SQL,
                new MapSqlParameterSource("narkey", naryadId),
                Long.class);
        if (unlocked != null && unlocked > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NOT_ALL_LOCKED_MESSAGE);
        }
        int updated = jdbc.update(CLOSE_VIPOLNENIE_SQL, new MapSqlParameterSource("narkey", naryadId));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
    }

    private NaryadLockTargetDto changeVipolnenieLock(int naryadId, List<Long> nodeIds, boolean lock) {
        naryadListService.findHeader(naryadId);
        if (readClosed(VIPOLNENIE_DESCRIPTOR_SQL, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        List<Long> ids = requireNodeIds(nodeIds);
        List<OrderedWork> ordered = jdbc.query(
                VIPOLNENIE_SELECTION_ORDER_SQL,
                new MapSqlParameterSource()
                        .addValue("narkey", naryadId)
                        .addValue("nodeIds", ids),
                (rs, rowNum) -> new OrderedWork(getLong(rs, "key"), getInteger(rs, "locked")));
        if (ordered.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        OrderedWork target = lock ? ordered.get(ordered.size() - 1) : ordered.get(0);
        if (lock && target.locked != null && target.locked == 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Работа уже заблокирована");
        }
        String sql = lock
                ? "CALL burnar.vipolnenie_lock_oper(?, ?)"
                : "CALL burnar.vipolnenie_un_lock_oper(?, ?)";
        callProcedure(sql, naryadId, target.key);
        return new NaryadLockTargetDto(target.key);
    }

    private BigDecimal sumHours(String sql, int naryadId) {
        BigDecimal sum = jdbc.queryForObject(sql, new MapSqlParameterSource("narkey", naryadId), BigDecimal.class);
        return sum == null ? BigDecimal.ZERO : sum;
    }

    private boolean readClosed(String descriptorSql, int naryadId) {
        List<Integer> descriptors = jdbc.query(
                descriptorSql,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> rs.getInt("closed"));
        if (descriptors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        return descriptors.get(0) == 1;
    }

    private NaryadWorkActionDto workAction(int naryadId, long nodeId, String rowsSql) {
        naryadListService.findHeader(naryadId);
        List<NaryadWorkDeletion.Node> nodes = loadWorkNodes(rowsSql, naryadId, List.of(nodeId));
        if (nodes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        NaryadWorkDeletion.Node node = nodes.get(0);
        return new NaryadWorkActionDto(node.id, node.operlifetype, node.locked, node.rs);
    }

    private List<Long> deleteWorks(
            int naryadId,
            List<Long> nodeIds,
            boolean refuseLocked,
            String descriptorSql,
            String rowsSql,
            String existsSql,
            String procedureSql,
            boolean bigintKeys) {
        naryadListService.findHeader(naryadId);
        if (readClosed(descriptorSql, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        List<Long> ids = requireNodeIds(nodeIds);
        List<NaryadWorkDeletion.Node> nodes = loadWorkNodes(rowsSql, naryadId, ids);
        if (nodes.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return NaryadWorkDeletion.deleteMarked(
                nodes,
                refuseLocked,
                id -> workExists(existsSql, naryadId, id),
                node -> callDeleteProcedure(procedureSql, node, naryadId, bigintKeys));
    }

    private void deleteBlock(
            int naryadId,
            long nodeId,
            String descriptorSql,
            String rowsSql,
            String procedureSql,
            boolean bigintKeys) {
        naryadListService.findHeader(naryadId);
        if (readClosed(descriptorSql, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        List<NaryadWorkDeletion.Node> nodes = loadWorkNodes(rowsSql, naryadId, List.of(nodeId));
        if (nodes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        NaryadWorkDeletion.Node node = nodes.get(0);
        String refusal = NaryadWorkDeletion.blockDeleteRefusal(node);
        if (refusal != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, refusal);
        }
        try {
            callDeleteProcedure(procedureSql, node, naryadId, bigintKeys);
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
    }

    private List<NaryadWorkDeletion.Node> loadWorkNodes(String sql, int naryadId, List<Long> nodeIds) {
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

    private boolean workExists(String sql, int naryadId, long nodeId) {
        List<Long> found = jdbc.query(
                sql,
                new MapSqlParameterSource("narkey", naryadId).addValue("nodeId", nodeId),
                (rs, rowNum) -> rs.getLong("key"));
        return !found.isEmpty();
    }

    /**
     * Каждый вызов со своим autocommit: успешные удаления остаются, как ExecProc в Delphi.
     * Ошибку не прячем — её разбирает цикл удаления или deleteBlock.
     */
    private void callDeleteProcedure(
            String sql, NaryadWorkDeletion.Node node, int naryadId, boolean bigintKeys) {
        jdbc.getJdbcTemplate().execute((Connection con) -> {
            boolean previousAutoCommit = con.getAutoCommit();
            con.setAutoCommit(true);
            try (CallableStatement cs = con.prepareCall(sql)) {
                bindWorkKey(cs, 1, node.id, bigintKeys);
                if (node.parentId == null) {
                    cs.setNull(2, bigintKeys ? Types.BIGINT : Types.INTEGER);
                } else {
                    bindWorkKey(cs, 2, node.parentId, bigintKeys);
                }
                if (node.prnum == null) {
                    cs.setNull(3, Types.NUMERIC);
                } else {
                    cs.setBigDecimal(3, node.prnum);
                }
                cs.setInt(4, naryadId);
                cs.execute();
            } finally {
                try {
                    con.setAutoCommit(previousAutoCommit);
                } catch (SQLException ignored) {
                    // Процедура уже завершила свою транзакцию.
                }
            }
            return null;
        });
    }

    private static void bindWorkKey(CallableStatement cs, int index, long value, boolean bigintKeys)
            throws SQLException {
        if (bigintKeys) {
            cs.setLong(index, value);
        } else {
            cs.setInt(index, Math.toIntExact(value));
        }
    }

    /**
     * Процедуры содержат COMMIT, поэтому вызов идёт при autocommit, вне транзакции Spring.
     */
    private void callProcedure(String sql, int naryadId, Long nodeId) {
        try {
            jdbc.getJdbcTemplate().execute((Connection con) -> {
                boolean previousAutoCommit = con.getAutoCommit();
                con.setAutoCommit(true);
                try (CallableStatement cs = con.prepareCall(sql)) {
                    if (nodeId == null) {
                        cs.setInt(1, naryadId);
                    } else {
                        cs.setLong(1, nodeId);
                        cs.setInt(2, naryadId);
                    }
                    cs.execute();
                } finally {
                    try {
                        con.setAutoCommit(previousAutoCommit);
                    } catch (SQLException ignored) {
                        // Процедура уже завершила свою транзакцию.
                    }
                }
                return null;
            });
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
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

    private static final class OrderedWork {
        final Long key;
        final Integer locked;

        OrderedWork(Long key, Integer locked) {
            this.key = key;
            this.locked = locked;
        }
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
