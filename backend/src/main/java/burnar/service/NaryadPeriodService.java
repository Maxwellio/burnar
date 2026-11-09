package burnar.service;

import burnar.dto.NaryadPeriodDto;
import burnar.dto.NaryadPeriodWriteRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Периоды выполнения одного наряда. Ключ строки ставит
 * {@code ftrg_vip_period_ins_before}, поэтому INSERT его не передаёт.
 * Удаление периода отвязывает работы и снимает значения отчёта триггерами и FK.
 */
@Service
public class NaryadPeriodService {

    static final String LIST_SQL =
            "SELECT t.key, t.nm, t.begoperdate, t.outoperdate "
                    + "FROM burnar.vipolnenie_period t "
                    + "WHERE t.narkey = :narkey "
                    + "ORDER BY t.begoperdate, t.outoperdate";

    static final String INSERT_SQL =
            "INSERT INTO burnar.vipolnenie_period (user_id, narkey, nm, begoperdate, outoperdate) "
                    + "VALUES (:userId, :narkey, :nm, :begoperdate, :outoperdate) "
                    + "RETURNING key";

    static final String UPDATE_SQL =
            "UPDATE burnar.vipolnenie_period "
                    + "SET nm = :nm, begoperdate = :begoperdate, outoperdate = :outoperdate "
                    + "WHERE key = :key AND narkey = :narkey";

    static final String DELETE_SQL =
            "DELETE FROM burnar.vipolnenie_period WHERE key = :key AND narkey = :narkey";

    static final String PERIOD_EXISTS_SQL =
            "SELECT COUNT(*) FROM burnar.vipolnenie_period WHERE key = :key AND narkey = :narkey";

    static final String LOCKED_ROWS_SQL =
            "SELECT o.key, o.locked FROM burnar.vipolnenie_oper o "
                    + "WHERE o.narkey = :narkey AND o.key IN (:nodeIds)";

    static final String BIND_SQL =
            "UPDATE burnar.vipolnenie_oper SET period = :periodKey "
                    + "WHERE narkey = :narkey AND key IN (:nodeIds)";

    static final String USER_ID_SQL =
            "SELECT u.users_id FROM burnar.users u WHERE upper(u.ora_name) = upper(:username)";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadPartAccess partAccess;

    public NaryadPeriodService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadPartAccess partAccess) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.partAccess = partAccess;
    }

    public List<NaryadPeriodDto> list(int naryadId) {
        naryadListService.findHeader(naryadId);
        return jdbc.query(LIST_SQL, naryadParams(naryadId), (rs, rowNum) -> mapPeriod(rs));
    }

    @Transactional
    public NaryadPeriodDto create(int naryadId, NaryadPeriodWriteRequest request) {
        naryadListService.findHeader(naryadId);
        requireOpen(naryadId);
        PeriodDraft draft = draft(request);
        MapSqlParameterSource params = writeParams(naryadId, null, draft)
                .addValue("userId", requireUserId());
        Long key = jdbc.queryForObject(INSERT_SQL, params, Long.class);
        if (key == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Период не создан");
        }
        return new NaryadPeriodDto(key, draft.nm, draft.beginText, draft.endText);
    }

    @Transactional
    public NaryadPeriodDto update(int naryadId, int periodKey, NaryadPeriodWriteRequest request) {
        naryadListService.findHeader(naryadId);
        requireOpen(naryadId);
        PeriodDraft draft = draft(request);
        int updated = jdbc.update(UPDATE_SQL, writeParams(naryadId, periodKey, draft));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Период не найден");
        }
        return new NaryadPeriodDto(periodKey, draft.nm, draft.beginText, draft.endText);
    }

    @Transactional
    public void delete(int naryadId, int periodKey) {
        naryadListService.findHeader(naryadId);
        requireOpen(naryadId);
        int deleted = jdbc.update(
                DELETE_SQL,
                new MapSqlParameterSource().addValue("narkey", naryadId).addValue("key", periodKey));
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Период не найден");
        }
    }

    /**
     * Пишет период только переданным строкам. Поддерево не обходится.
     * Все строки должны быть заблокированы и принадлежать этому наряду.
     */
    @Transactional
    public void bind(int naryadId, Long periodKey, List<Long> nodeIds) {
        naryadListService.findHeader(naryadId);
        requireOpen(naryadId);
        if (periodKey == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите период");
        }
        List<Long> ids = NaryadOperFormat.requireNodeIds(nodeIds);
        Long periods = jdbc.queryForObject(
                PERIOD_EXISTS_SQL,
                new MapSqlParameterSource().addValue("narkey", naryadId).addValue("key", periodKey),
                Long.class);
        if (periods == null || periods == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Период не найден");
        }
        List<Integer> locked = jdbc.query(
                LOCKED_ROWS_SQL,
                new MapSqlParameterSource().addValue("narkey", naryadId).addValue("nodeIds", ids),
                (rs, rowNum) -> {
                    int value = rs.getInt("locked");
                    return rs.wasNull() ? null : value;
                });
        if (locked.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        if (locked.stream().anyMatch(value -> value == null || value != 1)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadPartCommandService.NOT_ALL_LOCKED_MESSAGE);
        }
        int updated = jdbc.update(
                BIND_SQL,
                new MapSqlParameterSource()
                        .addValue("narkey", naryadId)
                        .addValue("periodKey", periodKey)
                        .addValue("nodeIds", ids));
        if (updated != ids.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
    }

    private void requireOpen(int naryadId) {
        if (partAccess.readClosed(false, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
    }

    private PeriodDraft draft(NaryadPeriodWriteRequest request) {
        NaryadPeriodWriteRequest body = request == null
                ? new NaryadPeriodWriteRequest(null, null, null)
                : request;
        String nm = NaryadPeriodRules.requireName(body.getNm());
        LocalDateTime begin = NaryadPeriodRules.requireStamp(body.getBegoperdate());
        LocalDateTime end = NaryadPeriodRules.requireStamp(body.getOutoperdate());
        NaryadPeriodRules.requireOrder(begin, end);
        return new PeriodDraft(nm, begin, end);
    }

    private MapSqlParameterSource writeParams(int naryadId, Integer periodKey, PeriodDraft draft) {
        MapSqlParameterSource params = naryadParams(naryadId)
                .addValue("nm", draft.nm)
                .addValue("begoperdate", Timestamp.valueOf(draft.begin))
                .addValue("outoperdate", Timestamp.valueOf(draft.end));
        if (periodKey != null) {
            params.addValue("key", periodKey);
        }
        return params;
    }

    private int requireUserId() {
        String username = currentUsername();
        if (username == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пользователь не найден");
        }
        List<Integer> ids = jdbc.query(
                USER_ID_SQL,
                new MapSqlParameterSource("username", username),
                (rs, rowNum) -> rs.getInt("users_id"));
        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Пользователь не найден");
        }
        return ids.get(0);
    }

    private static MapSqlParameterSource naryadParams(int naryadId) {
        return new MapSqlParameterSource("narkey", naryadId);
    }

    private static NaryadPeriodDto mapPeriod(ResultSet rs) throws SQLException {
        return new NaryadPeriodDto(
                rs.getLong("key"),
                rs.getString("nm"),
                NaryadPeriodRules.format(rs.getTimestamp("begoperdate").toLocalDateTime()),
                NaryadPeriodRules.format(rs.getTimestamp("outoperdate").toLocalDateTime()));
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }

    private static final class PeriodDraft {
        final String nm;
        final LocalDateTime begin;
        final LocalDateTime end;
        final String beginText;
        final String endText;

        PeriodDraft(String nm, LocalDateTime begin, LocalDateTime end) {
            this.nm = nm;
            this.begin = begin;
            this.end = end;
            this.beginText = NaryadPeriodRules.format(begin);
            this.endText = NaryadPeriodRules.format(end);
        }
    }
}
