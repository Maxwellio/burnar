package burnar.service;

import burnar.dto.NaryadHeaderDto;
import burnar.dto.NaryadSkvHeaderDto;
import burnar.dto.NaryadSkvParamDto;
import burnar.dto.NaryadSkvSaveRequest;
import burnar.dto.NaryadSkvSaveResultDto;
import burnar.dto.NaryadSkvValueDto;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Сквозные параметры задания и выполнения (Delphi formSkvZadVar / formSkvVipVar).
 * Запись: строки параметров ({@code trg_*_upd_after} → {@code *_set_skvparam}),
 * затем {@code begdate} и {@code *_set_date} — одной транзакцией, без COMMIT в процедурах.
 */
@Service
public class NaryadSkvParamsService {

    /** Часть наряда: описатель, таблица сквозных значений и процедура дат. */
    public enum Part {
        ZADANIE("burnar.defnarzad", "burnar.zndefnarzadatrib", "burnar.zadanie_set_date"),
        VIPOLNENIE("burnar.defnarvip", "burnar.zndefnarvipatrib", "burnar.vipolnenie_set_date");

        final String descriptorTable;
        final String valuesTable;
        final String setDateProcedure;

        Part(String descriptorTable, String valuesTable, String setDateProcedure) {
            this.descriptorTable = descriptorTable;
            this.valuesTable = valuesTable;
            this.setDateProcedure = setDateProcedure;
        }

        String headerSql(boolean forUpdate) {
            return "SELECT begdate, closed, closeddate FROM " + descriptorTable
                    + " WHERE narkey = :narkey" + (forUpdate ? " FOR UPDATE" : "");
        }

        /** qrParAndZnPlan / qrParAndZnFact. */
        String paramsSql() {
            return "SELECT zn.parcode, zn.prnum, "
                    + "(SELECT public.getparnm(zn.parcode))::varchar(200) AS nm, "
                    + "zn.znval, "
                    + "(SELECT p2.nm FROM public.common_spr p2 WHERE p2.id = zn.znval)::varchar(200) AS znnm, "
                    + "zn.val, zn.valstr "
                    + "FROM " + valuesTable + " zn "
                    + "WHERE zn.defnar = :narkey "
                    + "ORDER BY zn.prnum, zn.parcode";
        }

        /**
         * Поддеревья common_spr сразу для всех параметров наряда.
         * Порядок внутри уровня — row_number по ord, как в HIERARCHY1.
         */
        String valuesSql() {
            return "WITH RECURSIVE roots AS ("
                    + "  SELECT DISTINCT zn.parcode FROM " + valuesTable + " zn WHERE zn.defnar = :narkey"
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
        }

        String updateParamSql() {
            return "UPDATE " + valuesTable + " SET znval = :znval, val = :val, valstr = :valstr "
                    + "WHERE defnar = :narkey AND parcode = :parcode AND prnum = :prnum";
        }

        String updateBegDateSql() {
            return "UPDATE " + descriptorTable + " SET begdate = :begdate WHERE narkey = :narkey";
        }

        String setDateSql() {
            return "CALL " + setDateProcedure + "(:narkey)";
        }
    }

    /** Сохранённые значения, которых нет в поддереве своего параметра. */
    static final String VALUES_BY_IDS_SQL =
            "SELECT c.id, c.nm FROM public.common_spr c WHERE c.id IN (:ids)";

    static final String VALUE_IN_SUBTREE_SQL =
            "WITH RECURSIVE tmp AS ("
                    + "  SELECT c.id FROM public.common_spr c WHERE c.parent_id = :parcode "
                    + "  UNION ALL "
                    + "  SELECT c.id FROM public.common_spr c INNER JOIN tmp ON tmp.id = c.parent_id"
                    + ") "
                    + "SELECT EXISTS (SELECT 1 FROM tmp WHERE tmp.id = :znval)";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadPartCommandService naryadPartCommandService;

    public NaryadSkvParamsService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadPartCommandService naryadPartCommandService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.naryadPartCommandService = naryadPartCommandService;
    }

    public NaryadSkvHeaderDto findHeader(int naryadId, Part part) {
        requirePart(naryadId, part);
        Descriptor descriptor = loadDescriptor(naryadId, part, false);
        return new NaryadSkvHeaderDto(
                NaryadSkvParams.formatBegDate(descriptor.begdate),
                descriptor.closed,
                NaryadSkvParams.formatClosedDate(descriptor.closeddate),
                readOnlyReason(naryadId, part, descriptor));
    }

    public List<NaryadSkvParamDto> findParams(int naryadId, Part part) {
        requirePart(naryadId, part);
        return withValueLists(naryadId, part, queryParams(naryadId, part));
    }

    @Transactional
    public NaryadSkvSaveResultDto save(int naryadId, Part part, NaryadSkvSaveRequest request) {
        requirePart(naryadId, part);
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadSkvParams.BEG_DATE_REQUIRED);
        }
        Descriptor descriptor = loadDescriptor(naryadId, part, true);
        String refusal = readOnlyReason(naryadId, part, descriptor);
        if (refusal != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, refusal);
        }
        LocalDateTime begDate = NaryadSkvParams.parseBegDate(request.getBegDate());
        List<PendingUpdate> updates = pendingUpdates(naryadId, part, request.getParams());
        boolean dateChanged = !NaryadSkvParams.sameBegDate(descriptor.begdate, begDate);
        try {
            for (PendingUpdate update : updates) {
                jdbc.update(part.updateParamSql(), update.params);
            }
            if (dateChanged) {
                jdbc.update(
                        part.updateBegDateSql(),
                        new MapSqlParameterSource("narkey", naryadId)
                                .addValue("begdate", Timestamp.valueOf(begDate)));
                jdbc.update(part.setDateSql(), new MapSqlParameterSource("narkey", naryadId));
            }
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
        return new NaryadSkvSaveResultDto(dateChanged, updates.size());
    }

    private List<PendingUpdate> pendingUpdates(
            int naryadId, Part part, List<NaryadSkvSaveRequest.Param> changes) {
        if (changes == null || changes.isEmpty()) {
            return List.of();
        }
        Map<String, NaryadSkvParamDto> current = new LinkedHashMap<>();
        for (NaryadSkvParamDto row : queryParams(naryadId, part)) {
            current.put(NaryadSkvParams.key(row.getParcode(), row.getPrnum()), row);
        }
        Map<String, PendingUpdate> updates = new LinkedHashMap<>();
        for (NaryadSkvSaveRequest.Param change : changes) {
            if (change == null) {
                continue;
            }
            String key = NaryadSkvParams.key(change.getParcode(), change.getPrnum());
            NaryadSkvParamDto row = current.get(key);
            if (row == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, NaryadSkvParams.PARAM_NOT_FOUND);
            }
            BigDecimal val = NaryadSkvParams.normalizeVal(change.getVal());
            String valstr = NaryadSkvParams.normalizeValstr(change.getValstr());
            BigDecimal znval = change.getZnval();
            if (NaryadSkvParams.sameValues(row.getZnval(), row.getVal(), row.getValstr(), znval, val, valstr)) {
                updates.remove(key);
                continue;
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

    private List<NaryadSkvParamDto> queryParams(int naryadId, Part part) {
        return jdbc.query(
                part.paramsSql(),
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

    /**
     * Один обход справочника на все параметры. Сохранённое значение, которого нет
     * в поддереве, добавляется в список: иначе выпадающий список сбросил бы его.
     */
    private List<NaryadSkvParamDto> withValueLists(int naryadId, Part part, List<NaryadSkvParamDto> rows) {
        Map<String, List<NaryadSkvValueDto>> byCode = new LinkedHashMap<>();
        jdbc.query(part.valuesSql(), new MapSqlParameterSource("narkey", naryadId), rs -> {
            byCode.computeIfAbsent(codeKey(rs.getBigDecimal("parcode")), key -> new ArrayList<>())
                    .add(new NaryadSkvValueDto(rs.getBigDecimal("id"), rs.getString("nm")));
        });
        List<BigDecimal> missing = new ArrayList<>();
        for (NaryadSkvParamDto row : rows) {
            if (row.getZnval() != null && !containsValue(byCode.get(codeKey(row.getParcode())), row.getZnval())) {
                missing.add(row.getZnval());
            }
        }
        Map<String, NaryadSkvValueDto> extras = loadValuesById(missing);
        List<NaryadSkvParamDto> result = new ArrayList<>();
        for (NaryadSkvParamDto row : rows) {
            List<NaryadSkvValueDto> values = new ArrayList<>(
                    byCode.getOrDefault(codeKey(row.getParcode()), List.of()));
            NaryadSkvValueDto extra = row.getZnval() == null ? null : extras.get(codeKey(row.getZnval()));
            if (extra != null) {
                values.add(0, extra);
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
                VALUES_BY_IDS_SQL,
                new MapSqlParameterSource("ids", ids),
                (rs, rowNum) -> {
                    NaryadSkvValueDto value = new NaryadSkvValueDto(rs.getBigDecimal("id"), rs.getString("nm"));
                    byId.putIfAbsent(codeKey(value.getId()), value);
                    return value;
                });
        return byId;
    }

    private static String codeKey(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private boolean valueInSubtree(BigDecimal parcode, BigDecimal znval) {
        Boolean found = jdbc.queryForObject(
                VALUE_IN_SUBTREE_SQL,
                new MapSqlParameterSource("parcode", parcode).addValue("znval", znval),
                Boolean.class);
        return Boolean.TRUE.equals(found);
    }

    private String readOnlyReason(int naryadId, Part part, Descriptor descriptor) {
        long lockedWorks = part == Part.VIPOLNENIE
                ? naryadPartCommandService.countVipolnenieLocked(naryadId)
                : 0L;
        return NaryadSkvParams.readOnlyReason(descriptor.closed, lockedWorks);
    }

    private void requirePart(int naryadId, Part part) {
        NaryadHeaderDto header = naryadListService.findHeader(naryadId);
        boolean exists = part == Part.ZADANIE
                ? Boolean.TRUE.equals(header.getHasZadanie())
                : Boolean.TRUE.equals(header.getHasVipolnenie());
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
    }

    private Descriptor loadDescriptor(int naryadId, Part part, boolean forUpdate) {
        List<Descriptor> rows = jdbc.query(
                part.headerSql(forUpdate),
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> new Descriptor(
                        rs.getTimestamp("begdate"),
                        rs.getInt("closed") == 1,
                        rs.getTimestamp("closeddate")));
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        return rows.get(0);
    }

    private static boolean containsValue(List<NaryadSkvValueDto> values, BigDecimal id) {
        return values != null && values.stream().anyMatch(item -> sameNumber(item.getId(), id));
    }

    private static boolean sameNumber(BigDecimal a, BigDecimal b) {
        return a != null && b != null && a.compareTo(b) == 0;
    }

    private static final class Descriptor {
        final Timestamp begdate;
        final boolean closed;
        final Timestamp closeddate;

        Descriptor(Timestamp begdate, boolean closed, Timestamp closeddate) {
            this.begdate = begdate;
            this.closed = closed;
            this.closeddate = closeddate;
        }
    }

    private static final class PendingUpdate {
        final MapSqlParameterSource params;

        PendingUpdate(MapSqlParameterSource params) {
            this.params = params;
        }
    }
}
