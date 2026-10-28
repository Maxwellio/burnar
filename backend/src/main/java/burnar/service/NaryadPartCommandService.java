package burnar.service;

import burnar.dto.NaryadClosedDto;
import burnar.dto.NaryadHeaderDto;
import burnar.dto.NaryadLockTargetDto;
import burnar.dto.NaryadWorkLockDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

/**
 * Закрытие части, пустое выполнение, импорт работ, замена задания и блокировка выполнения.
 * Процедуры содержат COMMIT и вызываются при autocommit, вне транзакции Spring.
 */
@Service
public class NaryadPartCommandService {

    static final String NOT_ALL_LOCKED_MESSAGE = "Не все работы заблокированы!";
    static final String VIPOLNENIE_ALREADY_EXISTS = "Наряд-выполнение уже создано";
    static final String ZADANIE_NOT_CLOSED = "Наряд-задание не закрыто";
    static final String ZADANIE_HAS_NO_WORKS = "В задании нет работ";
    static final String VIPOLNENIE_HAS_WORKS = "В выполнении уже есть работы";
    static final String VIPOLNENIE_HAS_LOCKED = "Импорт недоступен: есть заблокированные работы";

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

    static final String VIPOLNENIE_LOCKED_COUNT_SQL =
            "SELECT count(*) FROM burnar.vipolnenie_oper o "
                    + "WHERE o.locked = 1 AND o.narkey = :narkey";

    static final String VIPOLNENIE_WORK_COUNT_SQL =
            "SELECT count(*) FROM burnar.vipolnenie_oper o WHERE o.narkey = :narkey";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadOperTreeService naryadOperTreeService;
    private final NaryadPartAccess partAccess;
    private final NaryadAutocommit autocommit;

    public NaryadPartCommandService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadOperTreeService naryadOperTreeService,
            NaryadPartAccess partAccess,
            NaryadAutocommit autocommit) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.naryadOperTreeService = naryadOperTreeService;
        this.partAccess = partAccess;
        this.autocommit = autocommit;
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
     * actCreateCopyNarVip. Повторный вызов не делается: процедура стёрла бы работы выполнения.
     */
    public NaryadHeaderDto createEmptyVipolnenie(int naryadId) {
        NaryadHeaderDto header = naryadListService.findHeader(naryadId);
        if (!Boolean.TRUE.equals(header.getHasZadanie())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        if (Boolean.TRUE.equals(header.getHasVipolnenie())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, VIPOLNENIE_ALREADY_EXISTS);
        }
        if (!Boolean.TRUE.equals(header.getZadanieClosed())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ZADANIE_NOT_CLOSED);
        }
        if (!naryadOperTreeService.hasZadanieRoots(naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, ZADANIE_HAS_NO_WORKS);
        }
        callProcedure("CALL burnar.vipolnenie_create(?)", naryadId, null);
        return naryadListService.findHeader(naryadId);
    }

    /**
     * actImportRabZad. datein = null: процедура берёт defnarvip.begdate.
     * Непустое или заблокированное выполнение не трогаем — процедура сначала удаляет работы.
     */
    public void importZadanieWorks(int naryadId) {
        NaryadHeaderDto header = naryadListService.findHeader(naryadId);
        if (!Boolean.TRUE.equals(header.getHasVipolnenie())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        if (Boolean.TRUE.equals(header.getVipolnenieClosed())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        if (count(VIPOLNENIE_LOCKED_COUNT_SQL, naryadId) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, VIPOLNENIE_HAS_LOCKED);
        }
        if (count(VIPOLNENIE_WORK_COUNT_SQL, naryadId) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, VIPOLNENIE_HAS_WORKS);
        }
        callZadanieToVipolnenie(naryadId);
    }

    /**
     * ToolButton23. Кнопкой пользуются админ и обычный пользователь.
     * copy_vip_to_zad орг. единицу не проверяет. Закрытие выполнения замене не мешает.
     */
    public NaryadHeaderDto replaceZadanieFromVipolnenie(int naryadId) {
        NaryadHeaderDto header = naryadListService.findHeader(naryadId);
        if (!Boolean.TRUE.equals(header.getHasZadanie()) || !Boolean.TRUE.equals(header.getHasVipolnenie())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        callProcedure("CALL burnar.copy_vip_to_zad(?)", naryadId, null);
        return naryadListService.findHeader(naryadId);
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

    /** Признаки блокировки всех работ выполнения этого наряда. */
    public List<NaryadWorkLockDto> vipolnenieLockFlags(int naryadId) {
        naryadListService.findHeader(naryadId);
        return jdbc.query(
                VIPOLNENIE_LOCK_FLAGS_SQL,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> new NaryadWorkLockDto(getLong(rs, "key"), getInteger(rs, "locked")));
    }

    long countVipolnenieLocked(int naryadId) {
        return count(VIPOLNENIE_LOCKED_COUNT_SQL, naryadId);
    }

    private NaryadClosedDto setPartClosed(int naryadId, Boolean closed, boolean zadanie) {
        naryadListService.findHeader(naryadId);
        if (closed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "closed is required");
        }
        boolean alreadyClosed = partAccess.readClosed(zadanie, naryadId);
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
        if (partAccess.readClosed(false, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        List<Long> ids = NaryadOperFormat.requireNodeIds(nodeIds);
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

    private long count(String sql, int naryadId) {
        Long value = jdbc.queryForObject(sql, new MapSqlParameterSource("narkey", naryadId), Long.class);
        return value == null ? 0L : value;
    }

    /** datein = null, как ParamByname('Datein').value := null. */
    private void callZadanieToVipolnenie(int naryadId) {
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall("CALL burnar.zadanie_to_vipolnenie(?, ?)")) {
                cs.setInt(1, naryadId);
                cs.setNull(2, Types.DATE);
                cs.execute();
            }
        });
    }

    private void callProcedure(String sql, int naryadId, Long nodeId) {
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall(sql)) {
                if (nodeId == null) {
                    cs.setInt(1, naryadId);
                } else {
                    cs.setLong(1, nodeId);
                    cs.setInt(2, naryadId);
                }
                cs.execute();
            }
        });
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
}
