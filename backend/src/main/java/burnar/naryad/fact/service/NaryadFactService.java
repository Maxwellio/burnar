package burnar.naryad.fact.service;

import burnar.naryad.fact.dto.NaryadFactDto;
import burnar.naryad.fact.dto.NaryadFactRequest;
import burnar.naryad.list.service.NaryadListService;
import burnar.naryad.shared.service.NaryadPartAccess;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.List;

/**
 * Ввод факта, как {@code SaveFact}: пишет {@code vipolnenie_norm.fact} во все {@code prnum}
 * строки работы. Правила {@code burnar.factkorr} не исполняются.
 */
@Service
public class NaryadFactService {

    static final String ROW_SQL =
            "SELECT o.operlifetype, o.locked, "
                    + "EXISTS (SELECT 1 FROM burnar.factkorr fr WHERE fr.idlife = o.operlifeid) AS kor "
                    + "FROM burnar.vipolnenie_oper o "
                    + "WHERE o.narkey = :narkey AND o.key = :nodeId";

    /**
     * Как {@code SaveFact}: факт пишется во все {@code prnum}.
     * Колонка читает только {@code prnum = 2}, поэтому без этой строки запись не начинаем.
     */
    static final String UPDATE_SQL =
            "UPDATE burnar.vipolnenie_norm SET fact = :fact WHERE vip_key = :nodeId "
                    + "AND EXISTS (SELECT 1 FROM burnar.vipolnenie_norm y "
                    + "WHERE y.vip_key = :nodeId AND y.prnum = 2)";

    static final String READ_SQL =
            "SELECT round(y.fact / 60, 2) AS fact FROM burnar.vipolnenie_norm y "
                    + "WHERE y.vip_key = :nodeId AND y.prnum = 2";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadPartAccess partAccess;

    public NaryadFactService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadPartAccess partAccess) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.partAccess = partAccess;
    }

    @Transactional
    public NaryadFactDto update(int naryadId, long nodeId, NaryadFactRequest request) {
        naryadListService.findHeader(naryadId);
        boolean closed = partAccess.readClosed(false, naryadId);
        WorkRow row = readRow(naryadId, nodeId);
        String refusal = NaryadFactRules.refusal(closed, row.locked, row.operlifetype, row.kor);
        if (refusal != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, refusal);
        }
        BigDecimal minutes;
        try {
            minutes = NaryadFactRules.hoursToMinutes(request == null ? null : request.getFact());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
        int updated = jdbc.update(
                UPDATE_SQL,
                new MapSqlParameterSource()
                        .addValue("nodeId", nodeId)
                        .addValue("fact", minutes, Types.NUMERIC));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadFactRules.NO_NORM_MESSAGE);
        }
        return new NaryadFactDto(nodeId, readHours(nodeId));
    }

    private WorkRow readRow(int naryadId, long nodeId) {
        List<WorkRow> rows = jdbc.query(
                ROW_SQL,
                params(naryadId, nodeId),
                (rs, rowNum) -> {
                    int type = rs.getInt("operlifetype");
                    Integer operlifetype = rs.wasNull() ? null : type;
                    int lockedValue = rs.getInt("locked");
                    boolean locked = !rs.wasNull() && lockedValue == 1;
                    return new WorkRow(operlifetype, locked, rs.getBoolean("kor"));
                });
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return rows.get(0);
    }

    private BigDecimal readHours(long nodeId) {
        List<BigDecimal> hours = jdbc.query(
                READ_SQL,
                new MapSqlParameterSource("nodeId", nodeId),
                (rs, rowNum) -> rs.getBigDecimal("fact"));
        return hours.isEmpty() ? null : hours.get(0);
    }

    private static MapSqlParameterSource params(int naryadId, long nodeId) {
        return new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("nodeId", nodeId);
    }

    private static final class WorkRow {
        private final Integer operlifetype;
        private final boolean locked;
        private final boolean kor;

        private WorkRow(Integer operlifetype, boolean locked, boolean kor) {
            this.operlifetype = operlifetype;
            this.locked = locked;
            this.kor = kor;
        }
    }
}
