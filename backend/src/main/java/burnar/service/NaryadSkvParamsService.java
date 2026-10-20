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

        String storedZnvalSql() {
            return "SELECT zn.znval FROM " + valuesTable + " zn "
                    + "WHERE zn.defnar = :narkey AND zn.parcode = :parcode "
                    + "ORDER BY zn.prnum";
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

    /** Поддерево common_spr под параметром, порядок как HIERARCHY1 (ord на каждом уровне). */
    static final String VALUES_SQL =
            "WITH RECURSIVE tmp AS ("
                    + "  SELECT c.id, c.nm, "
                    + "         ARRAY[(row_number() OVER (PARTITION BY c.parent_id ORDER BY c.ord, c.id))::integer] AS ord2 "
                    + "  FROM public.common_spr c WHERE c.parent_id = :parcode "
                    + "  UNION ALL "
                    + "  SELECT c.id, c.nm, "
                    + "         tmp.ord2 || ARRAY[(row_number() OVER (PARTITION BY c.parent_id ORDER BY c.ord, c.id))::integer] "
                    + "  FROM public.common_spr c INNER JOIN tmp ON tmp.id = c.parent_id"
                    + ") "
                    + "SELECT tmp.id, tmp.nm FROM tmp ORDER BY tmp.ord2";

    static final String VALUE_BY_ID_SQL = "SELECT c.id, c.nm FROM public.common_spr c WHERE c.id = :id";

    static final String VALUE_IN_SUBTREE_SQL =
            "WITH RECURSIVE tmp AS ("
                    + "  SELECT c.id FROM public.common_spr c WHERE c.parent_id = :parcode "
                    + "  UNION ALL "
                    + "  SELECT c.id FROM public.common_spr c INNER JOIN tmp ON tmp.id = c.parent_id"
                    + ") "
                    + "SELECT EXISTS (SELECT 1 FROM tmp WHERE tmp.id = :znval)";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;

    public NaryadSkvParamsService(NamedParameterJdbcTemplate jdbc, NaryadListService naryadListService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
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
        return queryParams(naryadId, part);
    }

    /**
     * Пункты для выбора справочного значения. Сохранённое значение всегда в списке,
     * даже если оно вне поддерева: иначе список сбросил бы его на пустое.
     */
    public List<NaryadSkvValueDto> findValues(int naryadId, Part part, BigDecimal parcode) {
        requirePart(naryadId, part);
        if (parcode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "parcode is required");
        }
        List<BigDecimal> stored = jdbc.query(
                part.storedZnvalSql(),
                new MapSqlParameterSource("narkey", naryadId).addValue("parcode", parcode),
                (rs, rowNum) -> rs.getBigDecimal("znval"));
        if (stored.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, NaryadSkvParams.PARAM_NOT_FOUND);
        }
        List<NaryadSkvValueDto> values = new ArrayList<>(jdbc.query(
                VALUES_SQL,
                new MapSqlParameterSource("parcode", parcode),
                (rs, rowNum) -> new NaryadSkvValueDto(rs.getBigDecimal("id"), rs.getString("nm"))));
        for (BigDecimal znval : stored) {
            if (znval == null || containsValue(values, znval)) {
                continue;
            }
            values.addAll(0, jdbc.query(
                    VALUE_BY_ID_SQL,
                    new MapSqlParameterSource("id", znval),
                    (rs, rowNum) -> new NaryadSkvValueDto(rs.getBigDecimal("id"), rs.getString("nm"))));
        }
        return values;
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
                        rs.getString("valstr")));
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
                ? count(NaryadWorkspaceService.VIPOLNENIE_LOCKED_COUNT_SQL, naryadId)
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

    private long count(String sql, int naryadId) {
        Long value = jdbc.queryForObject(sql, new MapSqlParameterSource("narkey", naryadId), Long.class);
        return value == null ? 0L : value;
    }

    private static boolean containsValue(List<NaryadSkvValueDto> values, BigDecimal id) {
        return values.stream().anyMatch(item -> sameNumber(item.getId(), id));
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
