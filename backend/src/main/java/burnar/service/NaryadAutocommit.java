package burnar.service;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Types;

/**
 * Вызов процедур наряда при autocommit. Процедуры содержат COMMIT,
 * поэтому соединение не должно быть внутри транзакции Spring.
 */
@Component
public class NaryadAutocommit {

    private final NamedParameterJdbcTemplate jdbc;

    public NaryadAutocommit(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Исключение драйвера остаётся исходным: его разбирает вызывающий. */
    public void run(SqlWork work) {
        jdbc.getJdbcTemplate().execute((Connection con) -> {
            boolean previousAutoCommit = con.getAutoCommit();
            con.setAutoCommit(true);
            try {
                work.run(con);
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

    public void runMapped(SqlWork work) {
        try {
            run(work);
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
    }

    static void bindNullableKey(CallableStatement cs, int index, Long value, boolean bigintKeys)
            throws SQLException {
        if (value == null) {
            cs.setNull(index, bigintKeys ? Types.BIGINT : Types.INTEGER);
        } else {
            bindWorkKey(cs, index, value, bigintKeys);
        }
    }

    static void bindPrnum(CallableStatement cs, int index, BigDecimal prnum) throws SQLException {
        if (prnum == null) {
            cs.setNull(index, Types.NUMERIC);
        } else {
            cs.setBigDecimal(index, prnum);
        }
    }

    static void bindWorkKey(CallableStatement cs, int index, long value, boolean bigintKeys)
            throws SQLException {
        if (bigintKeys) {
            cs.setLong(index, value);
        } else {
            cs.setInt(index, Math.toIntExact(value));
        }
    }

    @FunctionalInterface
    interface SqlWork {
        void run(Connection con) throws SQLException;
    }
}
