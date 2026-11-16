package burnar.service;

import burnar.dto.NaryadFactDateDto;
import burnar.dto.NaryadFactDateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Ручная фактическая дата начала работы: {@code actsetdateHANDmla}.
 * Пишет только выбранную строку и ставит {@code editdate = 1}.
 * Следующие работы не сдвигает — это делает блокировка, которая такую дату сохраняет.
 */
@Service
public class NaryadFactDateService {

    static final String READ_SQL =
            "SELECT begoperdate FROM burnar.vipolnenie_oper "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    static final String LOCK_SQL =
            "SELECT locked FROM burnar.vipolnenie_oper "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    static final String UPDATE_SQL =
            "UPDATE burnar.vipolnenie_oper "
                    + "SET begoperdate = :begoperdate, editdate = 1 "
                    + "WHERE narkey = :narkey AND key = :nodeId "
                    + "AND (locked IS NULL OR locked <> 1)";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadPartAccess partAccess;

    public NaryadFactDateService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadPartAccess partAccess) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.partAccess = partAccess;
    }

    public NaryadFactDateDto read(int naryadId, long nodeId) {
        naryadListService.findHeader(naryadId);
        List<Timestamp> rows = jdbc.query(
                READ_SQL,
                params(naryadId, nodeId),
                (rs, rowNum) -> rs.getTimestamp("begoperdate"));
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return new NaryadFactDateDto(nodeId, NaryadFactDateRules.formatIso(rows.get(0)));
    }

    @Transactional
    public NaryadFactDateDto update(int naryadId, long nodeId, NaryadFactDateRequest request) {
        naryadListService.findHeader(naryadId);
        if (partAccess.readClosed(false, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadOperCalc.CLOSED_MESSAGE);
        }
        LocalDateTime stamp = NaryadFactDateRules.requireStamp(
                request == null ? null : request.getBegoperdate());
        List<Integer> locked = jdbc.query(
                LOCK_SQL,
                params(naryadId, nodeId),
                (rs, rowNum) -> {
                    int value = rs.getInt("locked");
                    return rs.wasNull() ? null : value;
                });
        if (locked.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        if (locked.get(0) != null && locked.get(0) == 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadOperCalc.LOCKED_MESSAGE);
        }
        int updated = jdbc.update(
                UPDATE_SQL,
                params(naryadId, nodeId).addValue("begoperdate", Timestamp.valueOf(stamp)));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadOperCalc.LOCKED_MESSAGE);
        }
        List<Timestamp> stored = jdbc.query(
                READ_SQL,
                params(naryadId, nodeId),
                (rs, rowNum) -> rs.getTimestamp("begoperdate"));
        Timestamp value = stored.isEmpty() ? Timestamp.valueOf(stamp) : stored.get(0);
        return new NaryadFactDateDto(nodeId, NaryadOperFormat.formatBegoperdate(value));
    }

    private static MapSqlParameterSource params(int naryadId, long nodeId) {
        return new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("nodeId", nodeId);
    }
}
