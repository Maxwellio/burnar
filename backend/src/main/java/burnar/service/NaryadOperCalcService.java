package burnar.service;

import burnar.dto.NaryadCalcDateDto;
import burnar.dto.NaryadCalcNodeDto;
import burnar.dto.NaryadCalcResultDto;
import burnar.dto.NaryadOperParamSaveDto;
import burnar.dto.NaryadSkvValueDto;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Расчёт операции и сохранение её параметра.
 * Процедуры {@code *_rebuild_oper}, {@code *_calc_operp} и {@code setnextdateoper*}
 * не содержат COMMIT, поэтому весь расчёт идёт одной транзакцией.
 * OUT-параметры читаются через {@code set_config} внутри транзакции:
 * драйвер JDBC не всегда отдаёт их из CALL.
 *
 * Корреляция факта ({@code burnar.factkorr}) здесь не считается: ввод факта
 * в вебе ещё не сделан, скрипт Delphi выполняет у себя.
 */
@Service
public class NaryadOperCalcService {

    private static final String DISCRETE_VALUES_SQL =
            "SELECT z.dparam, z.key AS id, z.znach AS nm "
                    + "FROM public.zn_dparam z "
                    + "WHERE z.dparam IN (:parcodes) "
                    + "  AND z.key IN ( "
                    + "    SELECT DISTINCT y.zndparam "
                    + "    FROM public.sbor_norm y "
                    + "    JOIN public.norms n ON y.key_norm = n.key "
                    + "    WHERE n.operlifeid = :oplife "
                    + "    UNION "
                    + "    SELECT DISTINCT par.zndparam "
                    + "    FROM public.alg_operlife opa "
                    + "    JOIN public.algs al ON al.key = opa.alg "
                    + "    JOIN public.algzndparam par ON al.key = par.alg "
                    + "    WHERE opa.id_operlife = :oplife "
                    + "  ) "
                    + "ORDER BY z.orderv, z.znach";

    private static final String IZMER_SQL =
            "SELECT t.izmer FROM burnar.sprnartype t "
                    + "JOIN burnar.defnar d ON t.key = d.nartype "
                    + "WHERE d.key = :narkey";

    private static final String READ_CALC_SQL =
            "SELECT current_setting('burnar.calc_normaed', true) AS normaed, "
                    + "current_setting('burnar.calc_normaob', true) AS normaob, "
                    + "current_setting('burnar.calc_ist', true) AS ist, "
                    + "current_setting('burnar.calc_ist_present', true) AS ist_present, "
                    + "current_setting('burnar.calc_ot', true) AS ot, "
                    + "current_setting('burnar.calc_do', true) AS ado";

    private static final String DATES_SQL =
            "SELECT key, begoperdate FROM burnar.tkeydate "
                    + "WHERE narkey = :narkey "
                    + "  AND os_user IS NOT DISTINCT FROM current_setting('userenv.os_user', true)";

    private static final String DELETE_DATES_SQL =
            "DELETE FROM burnar.tkeydate "
                    + "WHERE narkey = :narkey "
                    + "  AND os_user IS NOT DISTINCT FROM current_setting('userenv.os_user', true)";

    private static final Part ZADANIE = Part.zadanie();
    private static final Part VIPOLNENIE = Part.vipolnenie();

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;

    public NaryadOperCalcService(
            NamedParameterJdbcTemplate jdbc, NaryadListService naryadListService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
    }

    @Transactional
    public NaryadCalcResultDto calcZadanie(int naryadId, long nodeId) {
        return calc(naryadId, nodeId, ZADANIE);
    }

    @Transactional
    public NaryadCalcResultDto calcVipolnenie(int naryadId, long nodeId) {
        return calc(naryadId, nodeId, VIPOLNENIE);
    }

    @Transactional
    public NaryadOperParamSaveDto saveZadanieParam(
            int naryadId, long nodeId, long parcode, BigDecimal value) {
        return saveParam(naryadId, nodeId, parcode, value, ZADANIE);
    }

    @Transactional
    public NaryadOperParamSaveDto saveVipolnenieParam(
            int naryadId, long nodeId, long parcode, BigDecimal value) {
        return saveParam(naryadId, nodeId, parcode, value, VIPOLNENIE);
    }

    /**
     * Коды значений дискретных параметров операции, как qrAllZnTekDiscrParam,
     * сразу для всех parcode строки.
     */
    public Map<String, List<NaryadSkvValueDto>> discreteOptions(Integer operlifeid, List<BigDecimal> parcodes) {
        Map<String, List<NaryadSkvValueDto>> grouped = new LinkedHashMap<>();
        if (operlifeid == null || parcodes == null || parcodes.isEmpty()) {
            return grouped;
        }
        List<BigDecimal> codes = new ArrayList<>();
        for (BigDecimal parcode : parcodes) {
            if (parcode != null) {
                codes.add(parcode);
            }
        }
        if (codes.isEmpty()) {
            return grouped;
        }
        jdbc.query(
                DISCRETE_VALUES_SQL,
                new MapSqlParameterSource()
                        .addValue("parcodes", codes)
                        .addValue("oplife", operlifeid),
                rs -> {
                    String key = plainKey(rs.getBigDecimal("dparam"));
                    grouped.computeIfAbsent(key, ignored -> new ArrayList<>())
                            .add(new NaryadSkvValueDto(plain(rs.getBigDecimal("id")), rs.getString("nm")));
                });
        return grouped;
    }

    private NaryadCalcResultDto calc(int naryadId, long nodeId, Part part) {
        naryadListService.findHeader(naryadId);
        boolean closed = readClosed(part.descriptorSql, naryadId);
        OperRow oper = readOper(part.operSql, naryadId, nodeId);
        String refusal = NaryadOperCalc.calcRefusal(
                closed, isLocked(oper.locked), oper.hasChildren, oper.operlifetype);
        if (refusal != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, refusal);
        }
        if (oper.operlifeid == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadOperCalc.NO_OPERLIFE);
        }
        BigDecimal izmer = readIzmer(naryadId);
        if (izmer == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadOperCalc.NO_IZMER);
        }
        try {
            putSetting("burnar.calc_key", Long.toString(nodeId));
            putSetting("burnar.calc_narkey", Integer.toString(naryadId));
            putSetting("burnar.calc_life", oper.operlifeid.toString());
            putSetting("burnar.calc_izmer", izmer.toPlainString());
            jdbc.getJdbcTemplate().execute(part.rebuildSql);
            if (NaryadOperCalc.rebuilt(readSetting("burnar.calc_aisrebuild"))) {
                return NaryadCalcResultDto.rebuilt();
            }
            jdbc.getJdbcTemplate().execute(part.calcSql);
            Map<String, Object> outs = jdbc.queryForMap(READ_CALC_SQL, new MapSqlParameterSource());
            jdbc.getJdbcTemplate().execute(part.nextDateSql);
            List<NaryadCalcDateDto> dates = readDates(naryadId);
            jdbc.update(DELETE_DATES_SQL, new MapSqlParameterSource("narkey", naryadId));
            return new NaryadCalcResultDto(false, nodeFrom(nodeId, outs), dates);
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
    }

    private NaryadOperParamSaveDto saveParam(
            int naryadId, long nodeId, long parcode, BigDecimal value, Part part) {
        naryadListService.findHeader(naryadId);
        boolean closed = readClosed(part.descriptorSql, naryadId);
        OperRow oper = readOper(part.operSql, naryadId, nodeId);
        if (!NaryadOperCalc.isCalculable(oper.operlifetype)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadOperCalc.PARAMS_TYPE_MESSAGE);
        }
        boolean locked = part.lockBlocksParams && isLocked(oper.locked);
        ParamRow row = readParam(part, naryadId, nodeId, parcode);
        String refusal = NaryadOperCalc.paramRefusal(closed, locked, row.ptype);
        if (refusal != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, refusal);
        }
        BigDecimal stored = value;
        if (row.ptype == 1) {
            try {
                stored = NaryadOperCalc.normalizeZnach(value);
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
            }
        } else if (!NaryadOperCalc.listed(value, discreteCodes(oper.operlifeid, parcode))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadOperCalc.VALUE_NOT_IN_LIST);
        }
        if (NaryadOperCalc.sameZnach(row.znach, stored)) {
            return NaryadOperParamSaveDto.unchanged(nodeId);
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("nodeId", nodeId)
                .addValue("parcode", parcode)
                .addValue("znach", stored, Types.NUMERIC);
        if (jdbc.update(part.updateParamSql, params) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, NaryadOperCalc.PARAM_NOT_FOUND);
        }
        jdbc.update(part.clearNormSql, new MapSqlParameterSource("nodeId", nodeId));
        jdbc.update(part.deleteIstSql, new MapSqlParameterSource("nodeId", nodeId));
        return NaryadOperParamSaveDto.cleared(nodeId);
    }

    private List<BigDecimal> discreteCodes(Integer operlifeid, long parcode) {
        List<NaryadSkvValueDto> options = discreteOptions(operlifeid, List.of(BigDecimal.valueOf(parcode)))
                .getOrDefault(plainKey(BigDecimal.valueOf(parcode)), List.of());
        List<BigDecimal> codes = new ArrayList<>();
        for (NaryadSkvValueDto option : options) {
            codes.add(option.getId());
        }
        return codes;
    }

    private boolean readClosed(String sql, int naryadId) {
        List<Integer> rows = jdbc.query(
                sql,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> rs.getInt("closed"));
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        return rows.get(0) == 1;
    }

    private OperRow readOper(String sql, int naryadId, long nodeId) {
        List<OperRow> rows = jdbc.query(
                sql,
                new MapSqlParameterSource().addValue("narkey", naryadId).addValue("nodeId", nodeId),
                (rs, rowNum) -> new OperRow(
                        getInteger(rs, "operlifeid"),
                        getInteger(rs, "operlifetype"),
                        getInteger(rs, "locked"),
                        rs.getBoolean("has_children")));
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return rows.get(0);
    }

    private ParamRow readParam(Part part, int naryadId, long nodeId, long parcode) {
        List<ParamRow> rows = jdbc.query(
                part.paramSql,
                new MapSqlParameterSource()
                        .addValue("narkey", naryadId)
                        .addValue("nodeId", nodeId)
                        .addValue("parcode", parcode),
                (rs, rowNum) -> new ParamRow(getInteger(rs, "ptype"), rs.getBigDecimal("znach")));
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, NaryadOperCalc.PARAM_NOT_FOUND);
        }
        return rows.get(0);
    }

    private BigDecimal readIzmer(int naryadId) {
        List<BigDecimal> rows = jdbc.query(
                IZMER_SQL,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> rs.getBigDecimal("izmer"));
        return rows.isEmpty() ? null : rows.get(0);
    }

    private void putSetting(String name, String value) {
        jdbc.queryForObject(
                "SELECT set_config(:name, :value, true)",
                new MapSqlParameterSource().addValue("name", name).addValue("value", value),
                String.class);
    }

    private String readSetting(String name) {
        return jdbc.queryForObject(
                "SELECT current_setting(:name, true)",
                new MapSqlParameterSource("name", name),
                String.class);
    }

    private List<NaryadCalcDateDto> readDates(int naryadId) {
        return jdbc.query(
                DATES_SQL,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> new NaryadCalcDateDto(
                        getLong(rs, "key"),
                        NaryadOperFormat.formatBegoperdate(rs.getTimestamp("begoperdate"))));
    }

    private static NaryadCalcNodeDto nodeFrom(long nodeId, Map<String, Object> outs) {
        return new NaryadCalcNodeDto(
                nodeId,
                NaryadOperCalc.settingDecimal(text(outs, "normaed")),
                NaryadOperCalc.settingDecimal(text(outs, "normaob")),
                NaryadOperCalc.settingText(text(outs, "ist"), text(outs, "ist_present")),
                NaryadOperCalc.settingDecimal(text(outs, "ot")),
                NaryadOperCalc.settingDecimal(text(outs, "ado")));
    }

    private static String text(Map<String, Object> row, String key) {
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(key)) {
                return entry.getValue() == null ? null : entry.getValue().toString();
            }
        }
        return null;
    }

    private static boolean isLocked(Integer locked) {
        return locked != null && locked == 1;
    }

    static BigDecimal plain(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return new BigDecimal(value.stripTrailingZeros().toPlainString());
    }

    static String plainKey(BigDecimal value) {
        BigDecimal plain = plain(value);
        return plain == null ? "" : plain.toPlainString();
    }

    private static Integer getInteger(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private static Long getLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static final class OperRow {
        final Integer operlifeid;
        final Integer operlifetype;
        final Integer locked;
        final boolean hasChildren;

        OperRow(Integer operlifeid, Integer operlifetype, Integer locked, boolean hasChildren) {
            this.operlifeid = operlifeid;
            this.operlifetype = operlifetype;
            this.locked = locked;
            this.hasChildren = hasChildren;
        }
    }

    private static final class ParamRow {
        final Integer ptype;
        final BigDecimal znach;

        ParamRow(Integer ptype, BigDecimal znach) {
            this.ptype = ptype;
            this.znach = znach;
        }
    }

    /**
     * Имена процедур и таблиц — константы части, не данные запроса.
     * keyCast: у задания ключ integer, у выполнения bigint.
     */
    private static final class Part {
        final String descriptorSql;
        final String operSql;
        final String paramSql;
        final String updateParamSql;
        final String clearNormSql;
        final String deleteIstSql;
        final String rebuildSql;
        final String calcSql;
        final String nextDateSql;
        final boolean lockBlocksParams;

        Part(
                String descriptorSql,
                String operTable,
                String paramTable,
                String paramKey,
                String normTable,
                String istTable,
                String procedurePrefix,
                String keyCast,
                boolean lockBlocksParams) {
            this.descriptorSql = descriptorSql;
            this.operSql = "SELECT o.operlifeid, o.operlifetype, o.locked, "
                    + "EXISTS (SELECT 1 FROM " + operTable + " c WHERE c.parent = o.key) AS has_children "
                    + "FROM " + operTable + " o "
                    + "WHERE o.narkey = :narkey AND o.key = :nodeId FOR UPDATE";
            this.paramSql = "SELECT up.type AS ptype, p.znach "
                    + "FROM " + paramTable + " p "
                    + "JOIN " + operTable + " o ON o.key = p." + paramKey + " "
                    + "JOIN public.user_param up ON up.key = p.parcode "
                    + "WHERE o.narkey = :narkey AND p." + paramKey + " = :nodeId AND p.parcode = :parcode "
                    + "FOR UPDATE OF p";
            this.updateParamSql = "UPDATE " + paramTable + " SET znach = :znach "
                    + "WHERE " + paramKey + " = :nodeId AND parcode = :parcode";
            this.clearNormSql = "UPDATE " + normTable + " SET norma = NULL WHERE " + paramKey + " = :nodeId";
            this.deleteIstSql = "DELETE FROM " + istTable + " WHERE " + paramKey + " = :nodeId";
            this.rebuildSql = rebuildDo(procedurePrefix + "_rebuild_oper", keyCast);
            this.calcSql = calcDo(procedurePrefix + "_calc_operp", keyCast);
            this.nextDateSql = "CALL burnar.setnextdateoper" + (keyCast.equals("bigint") ? "vip" : "zad")
                    + "(current_setting('burnar.calc_key')::" + keyCast
                    + ", current_setting('burnar.calc_narkey')::integer)";
            this.lockBlocksParams = lockBlocksParams;
        }

        static Part zadanie() {
            return new Part(
                    "SELECT closed FROM burnar.defnarzad WHERE narkey = :narkey FOR UPDATE",
                    "burnar.zadanie_oper",
                    "burnar.zadanie_param",
                    "zad_key",
                    "burnar.zadanie_norm",
                    "burnar.zadanie_ist",
                    "zadanie",
                    "integer",
                    false);
        }

        static Part vipolnenie() {
            return new Part(
                    "SELECT closed FROM burnar.defnarvip WHERE narkey = :narkey FOR UPDATE",
                    "burnar.vipolnenie_oper",
                    "burnar.vipolnenie_param",
                    "vip_key",
                    "burnar.vipolnenie_norm",
                    "burnar.vipolnenie_ist",
                    "vipolnenie",
                    "bigint",
                    true);
        }

        private static String rebuildDo(String procedure, String keyCast) {
            return "DO $body$ DECLARE r numeric; BEGIN "
                    + "CALL burnar." + procedure + "(current_setting('burnar.calc_key')::" + keyCast
                    + ", current_setting('burnar.calc_narkey')::integer, r); "
                    + "PERFORM set_config('burnar.calc_aisrebuild', coalesce(r::text, ''), true); "
                    + "END $body$";
        }

        private static String calcDo(String procedure, String keyCast) {
            return "DO $body$ DECLARE "
                    + "ed numeric := 0; ob numeric := 0; ist varchar := ''; "
                    + "ot numeric; ado numeric; "
                    + "iz numeric := current_setting('burnar.calc_izmer')::numeric; "
                    + "BEGIN "
                    + "CALL burnar." + procedure + "(current_setting('burnar.calc_key')::" + keyCast
                    + ", current_setting('burnar.calc_life')::integer, iz, ed, ob, ist, ot, ado); "
                    + "PERFORM set_config('burnar.calc_normaed', coalesce(ed::text, ''), true); "
                    + "PERFORM set_config('burnar.calc_normaob', coalesce(ob::text, ''), true); "
                    + "PERFORM set_config('burnar.calc_ist', coalesce(ist, ''), true); "
                    + "PERFORM set_config('burnar.calc_ist_present', "
                    + "CASE WHEN ist IS NULL THEN '0' ELSE '1' END, true); "
                    + "PERFORM set_config('burnar.calc_ot', coalesce(ot::text, ''), true); "
                    + "PERFORM set_config('burnar.calc_do', coalesce(ado::text, ''), true); "
                    + "END $body$";
        }
    }
}
