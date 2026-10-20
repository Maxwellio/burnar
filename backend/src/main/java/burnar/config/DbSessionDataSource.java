package burnar.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Перед выдачей соединения из пула записывает в сессию PostgreSQL пользователя запроса
 * ({@link DbSessionSettings}). Значения уровня сессии, а не транзакции: процедуры с
 * COMMIT внутри вызываются при autocommit, и SET LOCAL до них не дожил бы.
 * Ошибка не мешает выдать соединение: журнал получит умолчания базы, как раньше.
 */
public class DbSessionDataSource extends DelegatingDataSource {

    private static final Logger log = LoggerFactory.getLogger(DbSessionDataSource.class);

    public DbSessionDataSource(DataSource target) {
        super(target);
    }

    @Override
    public Connection getConnection() throws SQLException {
        return apply(super.getConnection());
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return apply(super.getConnection(username, password));
    }

    private Connection apply(Connection connection) {
        try {
            try (Statement reset = connection.createStatement()) {
                reset.execute(DbSessionSettings.RESET_SQL);
            }
            DbSessionSettings settings = currentSettings();
            if (settings != null) {
                try (PreparedStatement apply = connection.prepareStatement(DbSessionSettings.APPLY_SQL)) {
                    apply.setString(1, settings.getUsername());
                    apply.setString(2, settings.getHost());
                    apply.setString(3, settings.getUsername());
                    apply.execute();
                }
            }
            if (!connection.getAutoCommit()) {
                connection.commit();
            }
        } catch (SQLException ex) {
            log.warn("Не удалось записать пользователя в сессию PostgreSQL: {}", ex.getMessage());
            rollbackQuietly(connection);
        }
        return connection;
    }

    private static DbSessionSettings currentSettings() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return DbSessionSettings.of(auth.getName(), currentHost());
    }

    private static String currentHost() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes)) {
            return "";
        }
        HttpServletRequest request = ((ServletRequestAttributes) attributes).getRequest();
        return DbSessionSettings.clientHost(request.getHeader("X-Forwarded-For"), request.getRemoteAddr());
    }

    private static void rollbackQuietly(Connection connection) {
        try {
            if (!connection.getAutoCommit()) {
                connection.rollback();
            }
        } catch (SQLException ignored) {
            // соединение всё равно отдаём: дальше Spring сам решит, что с ним делать
        }
    }
}
