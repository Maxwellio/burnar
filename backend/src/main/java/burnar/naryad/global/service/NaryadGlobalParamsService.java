package burnar.naryad.global.service;

import burnar.naryad.global.dto.NaryadGlobalCheckDto;
import burnar.naryad.global.dto.NaryadGlobalFormDto;
import burnar.naryad.global.dto.NaryadGlobalSaveRequest;
import burnar.naryad.global.dto.NaryadGlobalSaveResultDto;
import burnar.naryad.list.dto.BrigadeDto;
import burnar.naryad.list.service.NaryadListCommandRules;
import burnar.naryad.list.service.NaryadListCommandService;
import burnar.naryad.list.service.NaryadListService;
import burnar.naryad.shared.dto.NaryadSkvValueDto;
import burnar.naryad.shared.service.NaryadProcedureMessages;
import burnar.naryad.skv.dto.NaryadSkvParamDto;
import burnar.naryad.skv.dto.NaryadSkvSaveRequest;
import burnar.naryad.skv.service.NaryadSkvParams;
import burnar.naryad.skv.service.NaryadSkvParamsService;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/**
 * Окно общих параметров наряда (Delphi {@code GlobalVarUnit}).
 * Одна транзакция пишет шапку, изменённые строки {@code znparams} и, если флажки менялись,
 * состав {@code narparanpr}. Триггер {@code trg_znparams_upd_after} срабатывает сам.
 */
@Service
public class NaryadGlobalParamsService {

    /** Шапка Delphi SQLQueryKOD: путь бригады, getmasters, автор, тип. Закрытие — обе части. */
    static final String FORM_SQL =
            "SELECT t.ownernar, "
                    + "(WITH RECURSIVE tmp AS ("
                    + "  SELECT o.id, o.parent, CAST(o.nm AS varchar(100)) AS path "
                    + "  FROM burnar.org_stru o WHERE o.parent = 0 "
                    + "  UNION ALL "
                    + "  SELECT o2.id, o2.parent, CAST(tmp.path || ', ' || o2.nm AS varchar(100)) "
                    + "  FROM burnar.org_stru o2 INNER JOIN tmp ON tmp.id = o2.parent"
                    + ") SELECT tmp.path FROM tmp WHERE tmp.id = w.org)::varchar(300) AS ownernarnm, "
                    + "t.createdate, "
                    + "burnar.getmasters(t.key)::varchar(200) AS namemaster, "
                    + "u.ora_name AS narauthornm, "
                    + "t.shifr, ntype.ops AS nartypenm, t.nm, "
                    + "COALESCE((SELECT z.closed FROM burnar.defnarzad z WHERE z.narkey = t.key), 0) AS zad_closed, "
                    + "COALESCE((SELECT v.closed FROM burnar.defnarvip v WHERE v.narkey = t.key), 0) AS vip_closed "
                    + "FROM burnar.defnar t "
                    + "INNER JOIN burnar.spr_workers w ON w.key = t.ownernar "
                    + "INNER JOIN burnar.users u ON u.users_id = t.narauthor "
                    + "INNER JOIN burnar.sprnartype ntype ON ntype.key = t.nartype "
                    + "WHERE t.key = :id";

    static final String LOCK_SQL =
            "SELECT t.key FROM burnar.defnar t WHERE t.key = :id FOR UPDATE";

    static final String PARAMS_SQL =
            "SELECT zn.parcode, zn.prnum, "
                    + "(SELECT public.getparnm(zn.parcode))::varchar(200) AS nm, "
                    + "zn.znval, "
                    + "(SELECT p2.nm FROM public.common_spr p2 WHERE p2.id = zn.znval)::varchar(200) AS znnm, "
                    + "zn.val, zn.valstr "
                    + "FROM burnar.znparams zn "
                    + "WHERE zn.defnar = :narkey "
                    + "ORDER BY zn.prnum, zn.parcode";

    /**
     * Поддеревья common_spr для обычных параметров. Скважина, куст и месторождение
     * не раскрываются: их справочники слишком большие и правятся поиском скважины.
     */
    static final String VALUES_SQL =
            "WITH RECURSIVE roots AS ("
                    + "  SELECT DISTINCT zn.parcode FROM burnar.znparams zn "
                    + "  WHERE zn.defnar = :narkey AND zn.parcode NOT IN (5, 149, 470)"
                    + "), tmp AS ("
                    + "  SELECT c.id, c.nm, roots.parcode AS root, "
                    + "         ARRAY[(row_number() OVER (PARTITION BY c.parent_id ORDER BY c.ord, c.id))::integer] AS ord2 "
                    + "  FROM public.common_spr c "
                    + "  INNER JOIN roots ON c.parent_id = roots.parcode "
                    + "  UNION ALL "
                    + "  SELECT c.id, c.nm, tmp.root, "
                    + "         tmp.ord2 || ARRAY[(row_number() OVER (PARTITION BY c.parent_id ORDER BY c.ord, c.id))::integer] "
                    + "  FROM public.common_spr c INNER JOIN tmp ON tmp.id = c.parent_id"
                    + ") "
                    + "SELECT tmp.root AS parcode, tmp.id, tmp.nm FROM tmp ORDER BY tmp.root, tmp.ord2";

    static final String UPDATE_HEADER_SQL =
            "UPDATE burnar.defnar SET ownernar = :ownernar, shifr = :shifr, nm = :nm WHERE key = :id";

    static final String UPDATE_PARAM_SQL =
            "UPDATE burnar.znparams SET znval = :znval, val = :val, valstr = :valstr "
                    + "WHERE defnar = :narkey AND parcode = :parcode AND prnum = :prnum";

    static final String WELL_TYPES_SQL =
            "SELECT id, sname FROM pr.pr_type_skv ORDER BY ord, id";

    static final String REPORT_PARAMS_SQL =
            "SELECT id, sname FROM pr.pr_identifikator WHERE type IN (3, 4) ORDER BY ord, id";

    static final String CHECKS_SQL =
            "SELECT parkey, partype FROM burnar.narparanpr WHERE narkey = :id AND partype IN (1, 2)";

    static final String KNOWN_WELL_TYPES_SQL =
            "SELECT id FROM pr.pr_type_skv WHERE id IN (:ids)";

    static final String KNOWN_REPORT_PARAMS_SQL =
            "SELECT id FROM pr.pr_identifikator WHERE type IN (3, 4) AND id IN (:ids)";

    static final String DELETE_CHECKS_SQL =
            "DELETE FROM burnar.narparanpr WHERE narkey = :id AND partype IN (1, 2)";

    static final String INSERT_CHECK_SQL =
            "INSERT INTO burnar.narparanpr (narkey, partype, parkey) "
                    + "VALUES (:narkey, :partype, :parkey)";

    private static final int WELL_TYPE = 1;
    private static final int REPORT_PARAM = 2;

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadListCommandService naryadListCommandService;

    public NaryadGlobalParamsService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadListCommandService naryadListCommandService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.naryadListCommandService = naryadListCommandService;
    }

    public NaryadGlobalFormDto findForm(int naryadId) {
        naryadListService.findHeader(naryadId);
        StoredHeader header = loadHeader(naryadId);
        Map<Integer, HashSet<Integer>> checks = loadChecks(naryadId);
        return new NaryadGlobalFormDto(
                NaryadGlobalParams.closed(header.zadanieClosed, header.vipolnenieClosed),
                header.ownerNar,
                header.ownerNarNm,
                brigades(header.ownerNar, header.ownerNarNm),
                NaryadGlobalParams.formatCreatedate(header.createdate),
                header.masters,
                header.authorNm,
                header.shifr,
                header.nartypeNm,
                header.nm,
                loadCatalog(WELL_TYPES_SQL, checks.get(WELL_TYPE)),
                loadCatalog(REPORT_PARAMS_SQL, checks.get(REPORT_PARAM)));
    }

    public List<NaryadSkvParamDto> findParams(int naryadId) {
        naryadListService.findHeader(naryadId);
        return withValueLists(naryadId, queryParams(naryadId));
    }

    @Transactional
    public NaryadGlobalSaveResultDto save(int naryadId, NaryadGlobalSaveRequest request) {
        if (request == null || request.getOwnerNar() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadListCommandRules.BRIGADE_REQUIRED);
        }
        naryadListService.findHeader(naryadId);
        lockDefnar(naryadId);
        StoredHeader header = loadHeader(naryadId);
        boolean closed = NaryadGlobalParams.closed(header.zadanieClosed, header.vipolnenieClosed);
        String shifr = NaryadGlobalParams.normalizeShifr(request.getShifr());
        String nm = NaryadGlobalParams.normalizeNm(request.getNm());
        boolean headerChanged = NaryadGlobalParams.headerChanged(
                header.ownerNar, header.shifr, header.nm, request.getOwnerNar(), shifr, nm);
        if (headerChanged && closed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadSkvParams.CLOSED_MESSAGE);
        }
        if (headerChanged && !request.getOwnerNar().equals(header.ownerNar) && !brigadeAllowed(request.getOwnerNar())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, NaryadListCommandRules.BRIGADE_FORBIDDEN);
        }
        List<PendingUpdate> updates = pendingUpdates(naryadId, closed, request.getParams());
        boolean checksChanged = Boolean.TRUE.equals(request.getChecksChanged());
        List<Integer> wellTypeIds = List.of();
        List<Integer> reportParamIds = List.of();
        if (checksChanged) {
            wellTypeIds = distinctIds(request.getWellTypeIds());
            reportParamIds = distinctIds(request.getReportParamIds());
            requireKnown(KNOWN_WELL_TYPES_SQL, wellTypeIds);
            requireKnown(KNOWN_REPORT_PARAMS_SQL, reportParamIds);
        }
        try {
            if (headerChanged) {
                jdbc.update(
                        UPDATE_HEADER_SQL,
                        new MapSqlParameterSource("id", naryadId)
                                .addValue("ownernar", request.getOwnerNar())
                                .addValue("shifr", shifr)
                                .addValue("nm", nm));
            }
            for (PendingUpdate update : updates) {
                jdbc.update(UPDATE_PARAM_SQL, update.params);
            }
            if (checksChanged) {
                jdbc.update(DELETE_CHECKS_SQL, new MapSqlParameterSource("id", naryadId));
                insertChecks(naryadId, WELL_TYPE, wellTypeIds);
                insertChecks(naryadId, REPORT_PARAM, reportParamIds);
            }
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
        return new NaryadGlobalSaveResultDto(nm, headerChanged, updates.size(), checksChanged);
    }

    private List<PendingUpdate> pendingUpdates(
            int naryadId, boolean closed, List<NaryadSkvSaveRequest.Param> changes) {
        if (changes == null || changes.isEmpty()) {
            return List.of();
        }
        Map<String, NaryadSkvParamDto> current = new LinkedHashMap<>();
        for (NaryadSkvParamDto row : queryParams(naryadId)) {
            current.put(NaryadGlobalParams.key(row.getParcode(), row.getPrnum()), row);
        }
        Map<String, PendingUpdate> updates = new LinkedHashMap<>();
        for (NaryadSkvSaveRequest.Param change : changes) {
            if (change == null) {
                continue;
            }
            String key = NaryadGlobalParams.key(change.getParcode(), change.getPrnum());
            NaryadSkvParamDto row = current.get(key);
            if (row == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, NaryadGlobalParams.PARAM_NOT_FOUND);
            }
            BigDecimal val = NaryadGlobalParams.normalizeVal(change.getVal());
            String valstr = NaryadSkvParams.normalizeValstr(change.getValstr());
            BigDecimal znval = change.getZnval();
            if (NaryadSkvParams.sameValues(row.getZnval(), row.getVal(), row.getValstr(), znval, val, valstr)) {
                updates.remove(key);
                continue;
            }
            if (closed) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadSkvParams.CLOSED_MESSAGE);
            }
            if (NaryadGlobalParams.locationParam(row.getParcode())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadGlobalParams.LOCATION_READONLY);
            }
            if (znval != null && !sameNumber(znval, row.getZnval()) && !valueInSubtree(row.getParcode(), znval)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadSkvParams.VALUE_NOT_IN_LIST);
            }
            updates.put(key, new PendingUpdate(new MapSqlParameterSource()
                    .addValue("narkey", naryadId)
                    .addValue("parcode", row.getParcode())
                    .addValue("prnum", row.getPrnum())
                    .addValue("znval", znval)
                    .addValue("val", val)
                    .addValue("valstr", valstr)));
        }
        return new ArrayList<>(updates.values());
    }

    private List<NaryadSkvParamDto> queryParams(int naryadId) {
        return jdbc.query(
                PARAMS_SQL,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> new NaryadSkvParamDto(
                        rs.getBigDecimal("parcode"),
                        rs.getBigDecimal("prnum"),
                        rs.getString("nm"),
                        rs.getBigDecimal("znval"),
                        rs.getString("znnm"),
                        rs.getBigDecimal("val"),
                        rs.getString("valstr"),
                        List.of()));
    }

    private List<NaryadSkvParamDto> withValueLists(int naryadId, List<NaryadSkvParamDto> rows) {
        Map<String, List<NaryadSkvValueDto>> byCode = new LinkedHashMap<>();
        jdbc.query(VALUES_SQL, new MapSqlParameterSource("narkey", naryadId), rs -> {
            byCode.computeIfAbsent(codeKey(rs.getBigDecimal("parcode")), key -> new ArrayList<>())
                    .add(new NaryadSkvValueDto(rs.getBigDecimal("id"), rs.getString("nm")));
        });
        List<BigDecimal> missing = new ArrayList<>();
        for (NaryadSkvParamDto row : rows) {
            if (row.getZnval() == null || NaryadGlobalParams.locationParam(row.getParcode())) {
                continue;
            }
            if (!containsValue(byCode.get(codeKey(row.getParcode())), row.getZnval())) {
                missing.add(row.getZnval());
            }
        }
        Map<String, NaryadSkvValueDto> extras = loadValuesById(missing);
        List<NaryadSkvParamDto> result = new ArrayList<>();
        for (NaryadSkvParamDto row : rows) {
            List<NaryadSkvValueDto> values = new ArrayList<>();
            if (!NaryadGlobalParams.locationParam(row.getParcode())) {
                values.addAll(byCode.getOrDefault(codeKey(row.getParcode()), List.of()));
                NaryadSkvValueDto extra = row.getZnval() == null ? null : extras.get(codeKey(row.getZnval()));
                if (extra != null) {
                    values.add(0, extra);
                }
            }
            result.add(new NaryadSkvParamDto(
                    row.getParcode(),
                    row.getPrnum(),
                    row.getNm(),
                    row.getZnval(),
                    row.getZnnm(),
                    row.getVal(),
                    row.getValstr(),
                    values));
        }
        return result;
    }

    private Map<String, NaryadSkvValueDto> loadValuesById(List<BigDecimal> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<String, NaryadSkvValueDto> byId = new LinkedHashMap<>();
        jdbc.query(
                NaryadSkvParamsService.VALUES_BY_IDS_SQL,
                new MapSqlParameterSource("ids", ids),
                (rs, rowNum) -> {
                    NaryadSkvValueDto value = new NaryadSkvValueDto(rs.getBigDecimal("id"), rs.getString("nm"));
                    byId.putIfAbsent(codeKey(value.getId()), value);
                    return value;
                });
        return byId;
    }

    private boolean valueInSubtree(BigDecimal parcode, BigDecimal znval) {
        Boolean found = jdbc.queryForObject(
                NaryadSkvParamsService.VALUE_IN_SUBTREE_SQL,
                new MapSqlParameterSource("parcode", parcode).addValue("znval", znval),
                Boolean.class);
        return Boolean.TRUE.equals(found);
    }

    private void lockDefnar(int naryadId) {
        List<Integer> keys = jdbc.query(
                LOCK_SQL,
                new MapSqlParameterSource("id", naryadId),
                (rs, rowNum) -> rs.getInt("key"));
        if (keys.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad not found");
        }
    }

    private StoredHeader loadHeader(int naryadId) {
        List<StoredHeader> rows = jdbc.query(
                FORM_SQL,
                new MapSqlParameterSource("id", naryadId),
                (rs, rowNum) -> new StoredHeader(
                        toInteger(rs.getObject("ownernar")),
                        rs.getString("ownernarnm"),
                        rs.getTimestamp("createdate"),
                        rs.getString("namemaster"),
                        rs.getString("narauthornm"),
                        rs.getString("shifr"),
                        rs.getString("nartypenm"),
                        rs.getString("nm"),
                        rs.getInt("zad_closed"),
                        rs.getInt("vip_closed")));
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad not found");
        }
        return rows.get(0);
    }

    private List<BrigadeDto> brigades(Integer ownerNar, String ownerNarNm) {
        List<BrigadeDto> list = new ArrayList<>(naryadListCommandService.findCreateBrigades());
        boolean present = ownerNar != null && list.stream().anyMatch(item -> ownerNar.equals(item.getId()));
        if (ownerNar != null && !present) {
            list.add(0, new BrigadeDto(ownerNar, ownerNarNm == null ? String.valueOf(ownerNar) : ownerNarNm));
        }
        return list;
    }

    private boolean brigadeAllowed(Integer ownerNar) {
        return naryadListCommandService.findCreateBrigades().stream()
                .anyMatch(item -> ownerNar.equals(item.getId()));
    }

    private Map<Integer, HashSet<Integer>> loadChecks(int naryadId) {
        Map<Integer, HashSet<Integer>> byType = new LinkedHashMap<>();
        byType.put(WELL_TYPE, new HashSet<>());
        byType.put(REPORT_PARAM, new HashSet<>());
        jdbc.query(CHECKS_SQL, new MapSqlParameterSource("id", naryadId), rs -> {
            HashSet<Integer> ids = byType.get(rs.getInt("partype"));
            if (ids != null) {
                ids.add(rs.getInt("parkey"));
            }
        });
        return byType;
    }

    private List<NaryadGlobalCheckDto> loadCatalog(String sql, HashSet<Integer> checked) {
        HashSet<Integer> selected = checked == null ? new HashSet<>() : checked;
        return jdbc.query(sql, (rs, rowNum) -> new NaryadGlobalCheckDto(
                rs.getInt("id"),
                rs.getString("sname"),
                selected.contains(rs.getInt("id"))));
    }

    private void requireKnown(String sql, List<Integer> ids) {
        if (ids.isEmpty()) {
            return;
        }
        List<Integer> found = jdbc.query(
                sql,
                new MapSqlParameterSource("ids", ids),
                (rs, rowNum) -> rs.getInt("id"));
        if (new HashSet<>(found).size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadGlobalParams.CHECK_NOT_FOUND);
        }
    }

    private void insertChecks(int naryadId, int partype, List<Integer> ids) {
        for (Integer id : ids) {
            jdbc.update(
                    INSERT_CHECK_SQL,
                    new MapSqlParameterSource("narkey", naryadId)
                            .addValue("partype", partype)
                            .addValue("parkey", id));
        }
    }

    private static List<Integer> distinctIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<Integer> set = new LinkedHashSet<>();
        for (Integer id : ids) {
            if (id != null) {
                set.add(id);
            }
        }
        return new ArrayList<>(set);
    }

    private static String codeKey(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private static boolean containsValue(List<NaryadSkvValueDto> values, BigDecimal id) {
        return values != null && values.stream().anyMatch(item -> sameNumber(item.getId(), id));
    }

    private static boolean sameNumber(BigDecimal left, BigDecimal right) {
        return left != null && right != null && left.compareTo(right) == 0;
    }

    private static Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return Integer.valueOf(value.toString());
    }

    private static final class StoredHeader {
        final Integer ownerNar;
        final String ownerNarNm;
        final Timestamp createdate;
        final String masters;
        final String authorNm;
        final String shifr;
        final String nartypeNm;
        final String nm;
        final Integer zadanieClosed;
        final Integer vipolnenieClosed;

        StoredHeader(
                Integer ownerNar,
                String ownerNarNm,
                Timestamp createdate,
                String masters,
                String authorNm,
                String shifr,
                String nartypeNm,
                String nm,
                Integer zadanieClosed,
                Integer vipolnenieClosed) {
            this.ownerNar = ownerNar;
            this.ownerNarNm = ownerNarNm;
            this.createdate = createdate;
            this.masters = masters;
            this.authorNm = authorNm;
            this.shifr = shifr;
            this.nartypeNm = nartypeNm;
            this.nm = nm;
            this.zadanieClosed = zadanieClosed;
            this.vipolnenieClosed = vipolnenieClosed;
        }
    }

    private static final class PendingUpdate {
        final MapSqlParameterSource params;

        PendingUpdate(MapSqlParameterSource params) {
            this.params = params;
        }
    }
}
