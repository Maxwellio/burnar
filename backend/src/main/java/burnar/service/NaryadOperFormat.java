package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Правила строки работы без доступа к базе: дата начала, типы 79/80, цвет и список id.
 */
public final class NaryadOperFormat {

    static final int OPERTYPE_COMBINATION = 79;
    static final int OPERTYPE_ALGORITHM = 80;

    private static final DateTimeFormatter DATE_ONLY = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");

    private NaryadOperFormat() {
    }

    static List<Long> requireNodeIds(List<Long> nodeIds) {
        if (nodeIds == null || nodeIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeIds are required");
        }
        LinkedHashSet<Long> distinct = new LinkedHashSet<>();
        for (Long nodeId : nodeIds) {
            if (nodeId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "nodeIds are required");
            }
            distinct.add(nodeId);
        }
        return List.copyOf(distinct);
    }

    static int requireValidColor(Integer color) {
        if (color == null || color < 0 || color > 0xFFFFFF) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Color must be between 0 and 16777215");
        }
        return color;
    }

    static boolean loadsParams(Integer operlifetype) {
        return operlifetype != null
                && (operlifetype == OPERTYPE_COMBINATION || operlifetype == OPERTYPE_ALGORITHM);
    }

    static boolean loadsAlgorithm(Integer operlifetype) {
        return operlifetype != null && operlifetype == OPERTYPE_ALGORITHM;
    }

    /**
     * Дата без времени, если часы, минуты и секунды нулевые; иначе dd.MM.yyyy HH:mm:ss.
     */
    static String formatBegoperdate(Timestamp value) {
        if (value == null) {
            return null;
        }
        LocalDateTime local = value.toLocalDateTime();
        if (local.getHour() == 0 && local.getMinute() == 0 && local.getSecond() == 0) {
            return local.format(DATE_ONLY);
        }
        return local.format(DATE_TIME);
    }
}
