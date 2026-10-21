package burnar.config;

/**
 * Переменные сессии PostgreSQL, которые читают триггеры журналов
 * ({@code ftrg_defnar*_upd}, {@code ftrg_log_atrib_*} и др.) через {@code current_setting}.
 * Delphi ставил их при входе ({@code MainUnit}): {@code burnar.user_id}, {@code USERENV.OS_USER},
 * {@code USERENV.HOST}. Соединения в пуле общие, поэтому значения переписываются
 * при каждой выдаче соединения, а без пользователя возвращаются к умолчаниям базы.
 */
public final class DbSessionSettings {

    static final String RESET_SQL =
            "RESET burnar.user_id; RESET userenv.os_user; RESET userenv.host";

    /** burnar.user_id ставится, только если логин найден в burnar.users; иначе остаётся умолчание. */
    static final String APPLY_SQL =
            "SELECT set_config('userenv.os_user', ?, false), "
                    + "set_config('userenv.host', ?, false), "
                    + "(SELECT set_config('burnar.user_id', u.users_id::text, false) "
                    + "   FROM burnar.users u WHERE upper(u.ora_name) = upper(?) LIMIT 1)";

    static final int HOST_MAX_LENGTH = 100;

    private final String username;
    private final String host;

    private DbSessionSettings(String username, String host) {
        this.username = username;
        this.host = host;
    }

    /** null — нет вошедшего пользователя, сессию нужно только сбросить. */
    public static DbSessionSettings of(String username, String host) {
        if (username == null || username.isBlank()) {
            return null;
        }
        return new DbSessionSettings(username.trim(), host == null ? "" : host);
    }

    /** Первый адрес X-Forwarded-For, если запрос пришёл через прокси, иначе адрес соединения. */
    public static String clientHost(String forwardedFor, String remoteAddr) {
        String host = remoteAddr;
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isEmpty()) {
                host = first;
            }
        }
        if (host == null) {
            return "";
        }
        return host.length() > HOST_MAX_LENGTH ? host.substring(0, HOST_MAX_LENGTH) : host;
    }

    public String getUsername() {
        return username;
    }

    public String getHost() {
        return host;
    }
}
