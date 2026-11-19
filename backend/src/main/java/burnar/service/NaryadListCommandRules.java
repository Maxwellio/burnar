package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

/**
 * Проверки создания и удаления наряда со списка, без обращения к базе.
 * Наименование — {@code defnar.nm varchar(50)}. Дата начала — как сквозные параметры.
 */
public final class NaryadListCommandRules {

    public static final int NAME_MAX = 50;
    public static final String NAME_TOO_LONG = "Наименование наряда длиннее 50 символов";
    public static final String BRIGADE_REQUIRED = "Выберите бригаду";
    public static final String BRIGADE_FORBIDDEN = "Бригада недоступна";
    public static final String USER_NOT_FOUND = "Пользователь не найден";
    public static final String ZADANIE_CLOSED = "Наряд-задание закрыто от изменений";
    public static final String VIPOLNENIE_CLOSED = "Наряд-выполнение закрыто от изменений";

    private NaryadListCommandRules() {
    }

    /** Пустая строка не пишется в {@code defnar.nm}. */
    public static String optionalName(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String name = raw.trim();
        if (name.length() > NAME_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NAME_TOO_LONG);
        }
        return name;
    }

    /** Пустая дата не пишется в {@code defnarzad.begdate}. Непустая проверяется до создания наряда. */
    public static LocalDateTime optionalBegDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return NaryadSkvParams.parseBegDate(raw);
    }

    /**
     * Закрытое задание или закрытое выполнение удалять нельзя.
     * Нет описателя — часть не закрыта. Если закрыты обе, сообщаем про задание.
     */
    public static String deleteRefusal(Boolean zadanieClosed, Boolean vipolnenieClosed) {
        if (Boolean.TRUE.equals(zadanieClosed)) {
            return ZADANIE_CLOSED;
        }
        if (Boolean.TRUE.equals(vipolnenieClosed)) {
            return VIPOLNENIE_CLOSED;
        }
        return null;
    }
}
