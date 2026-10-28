package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Признак закрытия части наряда. Один и тот же {@code FOR UPDATE} читают цвет,
 * команды карточки и правка дерева. Доступ к наряду проверяет {@link NaryadListService}.
 */
@Component
public class NaryadPartAccess {

    static final String ZADANIE_DESCRIPTOR_SQL =
            "SELECT closed FROM burnar.defnarzad WHERE narkey = :narkey FOR UPDATE";

    static final String VIPOLNENIE_DESCRIPTOR_SQL =
            "SELECT closed FROM burnar.defnarvip WHERE narkey = :narkey FOR UPDATE";

    private final NamedParameterJdbcTemplate jdbc;

    public NaryadPartAccess(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** {@code zadanie = true} читает описатель задания. Пустой результат — 404. */
    boolean readClosed(boolean zadanie, int naryadId) {
        String descriptorSql = zadanie ? ZADANIE_DESCRIPTOR_SQL : VIPOLNENIE_DESCRIPTOR_SQL;
        List<Integer> descriptors = jdbc.query(
                descriptorSql,
                new MapSqlParameterSource("narkey", naryadId),
                (rs, rowNum) -> rs.getInt("closed"));
        if (descriptors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad descriptor not found");
        }
        return descriptors.get(0) == 1;
    }
}
