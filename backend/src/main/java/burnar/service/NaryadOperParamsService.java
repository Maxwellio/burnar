package burnar.service;

import burnar.dto.NaryadAlgorithmDto;
import burnar.dto.NaryadOperParamDto;
import burnar.dto.NaryadSkvValueDto;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Параметры операции и текст алгоритма карточки наряда.
 * SQL как Delphi qrParamZ / qrParamV / qrAlgInfo.
 * Доступ — через {@link NaryadListService#findHeader(int)}.
 */
@Service
public class NaryadOperParamsService {

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
            "SELECT operlifeid, operlifetype, locked FROM burnar.zadanie_oper "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    private static final String VIPOLNENIE_OPER_REF_SQL =
            "SELECT operlifeid, operlifetype, locked FROM burnar.vipolnenie_oper "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    private static final String ZADANIE_CLOSED_SQL =
            "SELECT closed FROM burnar.defnarzad WHERE narkey = :narkey";

    private static final String VIPOLNENIE_CLOSED_SQL =
            "SELECT closed FROM burnar.defnarvip WHERE narkey = :narkey";

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
    private final NaryadOperCalcService naryadOperCalcService;

    public NaryadOperParamsService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadOperCalcService naryadOperCalcService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.naryadOperCalcService = naryadOperCalcService;
    }

    public List<NaryadOperParamDto> findZadanieParams(int naryadId, Long nodeId) {
        naryadListService.findHeader(naryadId);
        OperRef ref = loadOperRef(ZADANIE_OPER_REF_SQL, naryadId, nodeId);
        if (ref == null || !NaryadOperFormat.loadsParams(ref.operlifetype)) {
            return List.of();
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("zadkey", nodeId)
                .addValue("aoperlifeid", ref.operlifeid);
        List<NaryadOperParamDto> rows = jdbc.query(ZADANIE_PARAMS_SQL, params, PARAM_MAPPER);
        attachParamEditors(rows, nodeId, ref.operlifeid, paramEditable(ZADANIE_CLOSED_SQL, naryadId, false, ref));
        return rows;
    }

    public List<NaryadOperParamDto> findVipolnenieParams(int naryadId, Long nodeId) {
        naryadListService.findHeader(naryadId);
        OperRef ref = loadOperRef(VIPOLNENIE_OPER_REF_SQL, naryadId, nodeId);
        if (ref == null || !NaryadOperFormat.loadsParams(ref.operlifetype)) {
            return List.of();
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("vipkey", nodeId)
                .addValue("aoperlifeid", ref.operlifeid);
        List<NaryadOperParamDto> rows = jdbc.query(VIPOLNENIE_PARAMS_SQL, params, PARAM_MAPPER);
        attachParamEditors(rows, nodeId, ref.operlifeid, paramEditable(VIPOLNENIE_CLOSED_SQL, naryadId, true, ref));
        return rows;
    }

    public NaryadAlgorithmDto findZadanieAlgorithm(int naryadId, Long nodeId) {
        return findAlgorithm(naryadId, nodeId, ZADANIE_OPER_REF_SQL);
    }

    public NaryadAlgorithmDto findVipolnenieAlgorithm(int naryadId, Long nodeId) {
        return findAlgorithm(naryadId, nodeId, VIPOLNENIE_OPER_REF_SQL);
    }

    private NaryadAlgorithmDto findAlgorithm(int naryadId, Long nodeId, String refSql) {
        naryadListService.findHeader(naryadId);
        OperRef ref = loadOperRef(refSql, naryadId, nodeId);
        if (ref == null || !NaryadOperFormat.loadsAlgorithm(ref.operlifetype) || ref.operlifeid == null) {
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
                (rs, rowNum) -> new OperRef(
                        getInteger(rs, "operlifeid"),
                        getInteger(rs, "operlifetype"),
                        getInteger(rs, "locked")));
        return rows.isEmpty() ? null : rows.get(0);
    }

    /**
     * Закрытая часть только для чтения. В выполнении заблокированная работа тоже:
     * в задании блокировка параметры не закрывает, как ReadOpParams.
     */
    private boolean paramEditable(String closedSql, int naryadId, boolean lockBlocksEdit, OperRef ref) {
        if (partClosed(closedSql, naryadId)) {
            return false;
        }
        return !lockBlocksEdit || ref.locked == null || ref.locked != 1;
    }

    private boolean partClosed(String sql, int naryadId) {
        List<Integer> rows = jdbc.query(
                sql,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> rs.getInt("closed"));
        return rows.isEmpty() || rows.get(0) == 1;
    }

    private void attachParamEditors(
            List<NaryadOperParamDto> rows, Long nodeId, Integer operlifeid, boolean editable) {
        List<BigDecimal> discrete = new ArrayList<>();
        for (NaryadOperParamDto row : rows) {
            row.setNodeId(nodeId);
            row.setEditable(editable);
            row.setParcode(NaryadOperCalcService.plain(row.getParcode()));
            row.setZnachCode(NaryadOperCalcService.plain(row.getZnachCode()));
            if (row.getPtype() != null && row.getPtype() == 2 && row.getParcode() != null) {
                discrete.add(row.getParcode());
            }
        }
        Map<String, List<NaryadSkvValueDto>> options =
                naryadOperCalcService.discreteOptions(operlifeid, discrete);
        for (NaryadOperParamDto row : rows) {
            if (row.getPtype() == null || row.getPtype() != 2) {
                continue;
            }
            List<NaryadSkvValueDto> values = new ArrayList<>(
                    options.getOrDefault(NaryadOperCalcService.plainKey(row.getParcode()), List.of()));
            appendStoredDiscrete(values, row);
            row.setValues(values);
        }
    }

    /** Сохранённый код вне списка норм всё равно виден в ячейке и может остаться выбранным. */
    private static void appendStoredDiscrete(List<NaryadSkvValueDto> values, NaryadOperParamDto row) {
        if (row.getZnachCode() == null) {
            return;
        }
        for (NaryadSkvValueDto value : values) {
            if (value.getId() != null && value.getId().compareTo(row.getZnachCode()) == 0) {
                return;
            }
        }
        values.add(new NaryadSkvValueDto(row.getZnachCode(), row.getVal() == null ? "" : row.getVal()));
    }

    private static Integer getInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static final class OperRef {
        final Integer operlifeid;
        final Integer operlifetype;
        final Integer locked;

        OperRef(Integer operlifeid, Integer operlifetype, Integer locked) {
            this.operlifeid = operlifeid;
            this.operlifetype = operlifetype;
            this.locked = locked;
        }
    }
}
