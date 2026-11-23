package burnar.naryad.list.service;

import burnar.naryad.list.dto.BrigadeDto;
import burnar.naryad.list.dto.NaryadCreateRequest;
import burnar.naryad.list.dto.NaryadCreatedDto;
import burnar.naryad.shared.service.NaryadAutocommit;
import burnar.naryad.shared.service.NaryadProcedureMessages;
import burnar.org.service.OrgAccessService;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Создание и удаление наряда с главной страницы.
 * Создание повторяет MainUnit.mnuNewNarClick: тип бурения, владелец, автор, затем createnar.
 * Удаление повторяет NarListUnit.DeleteNars и дополнительно запрещает закрытое выполнение.
 */
@Service
public class NaryadListCommandService {

    /** Список на главной показывает только бурение. */
    static final int DRILLING_NARTYPE = 1;

    static final String CREATE_SQL = "CALL burnar.createnar(?, ?, ?, ?)";

    static final String UPDATE_NAME_SQL =
            "UPDATE burnar.defnar SET nm = :nm WHERE key = :id";

    static final String UPDATE_BEGDATE_SQL =
            "UPDATE burnar.defnarzad SET begdate = :begdate WHERE narkey = :id";

    static final String SET_DATE_SQL = "CALL burnar.zadanie_set_date(?)";

    static final String USER_ID_SQL =
            "SELECT u.users_id FROM burnar.users u WHERE upper(u.ora_name) = upper(:username)";

    /**
     * Путь бригады как в колонке «Бригада» и в Delphi qrWorkers.
     * Подпись — путь оргструктуры, значение — spr_workers.key.
     */
    private static final String BRIGADE_SELECT =
            "WITH RECURSIVE path(id, parent, path) AS ( "
                    + "  SELECT o.id, o.parent, CAST(o.nm AS varchar(100)) "
                    + "  FROM burnar.org_stru o WHERE o.parent = 0 "
                    + "  UNION ALL "
                    + "  SELECT o2.id, o2.parent, CAST(path.path || ', ' || o2.nm AS varchar(100)) "
                    + "  FROM burnar.org_stru o2 INNER JOIN path ON path.id = o2.parent "
                    + ") "
                    + "SELECT t.key AS id, path.path AS nm "
                    + "FROM path "
                    + "INNER JOIN burnar.spr_workers t ON path.id = t.org "
                    + "WHERE path.path IS NOT NULL ";

    /** sysboss-поддерево активной карьеры пользователя, как qrWorkers. */
    private static final String BRIGADE_SUBTREE =
            "AND t.org IN (WITH RECURSIVE tr AS ("
                    + "  SELECT c.id FROM burnar.org_stru c WHERE c.id = :aclUserOrgId "
                    + "  UNION ALL "
                    + "  SELECT c.id FROM burnar.org_stru c INNER JOIN tr ON c.sysboss = tr.id"
                    + ") SELECT tr.id FROM tr) ";

    private static final String BRIGADE_ORDER = "ORDER BY path.path, t.key";

    static final String CREATE_BRIGADES_SQL = BRIGADE_SELECT + BRIGADE_SUBTREE + BRIGADE_ORDER;

    static final String ADMIN_CREATE_BRIGADES_SQL = BRIGADE_SELECT + BRIGADE_ORDER;

    static final String CLOSED_SQL =
            "SELECT "
                    + "(SELECT z.closed FROM burnar.defnarzad z WHERE z.narkey = :id) AS zadanie_closed, "
                    + "(SELECT v.closed FROM burnar.defnarvip v WHERE v.narkey = :id) AS vipolnenie_closed";

    /** Порядок как в Delphi: периоды, работы задания, работы выполнения, описатель. */
    static final List<String> DELETE_SQL = List.of(
            "DELETE FROM burnar.vipolnenie_period WHERE narkey = :id",
            "DELETE FROM burnar.zadanie_oper WHERE narkey = :id",
            "DELETE FROM burnar.vipolnenie_oper WHERE narkey = :id",
            "DELETE FROM burnar.defnar WHERE key = :id");

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadAutocommit autocommit;
    private final NaryadListService naryadListService;
    private final OrgAccessService orgAccessService;

    public NaryadListCommandService(
            NamedParameterJdbcTemplate jdbc,
            NaryadAutocommit autocommit,
            NaryadListService naryadListService,
            OrgAccessService orgAccessService) {
        this.jdbc = jdbc;
        this.autocommit = autocommit;
        this.naryadListService = naryadListService;
        this.orgAccessService = orgAccessService;
    }

    /** Бригады для окна создания. Админ — весь справочник, остальные — своё поддерево. */
    public List<BrigadeDto> findCreateBrigades() {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            return List.of();
        }
        if (orgAccessService.isAdmin(username)) {
            return queryBrigades(ADMIN_CREATE_BRIGADES_SQL, new MapSqlParameterSource());
        }
        Optional<Integer> orgId = orgAccessService.resolveUserOrgId(username);
        if (orgId.isEmpty()) {
            return List.of();
        }
        return queryBrigades(
                CREATE_BRIGADES_SQL,
                new MapSqlParameterSource("aclUserOrgId", orgId.get()));
    }

    /**
     * createnar содержит COMMIT, поэтому вызов идёт при autocommit.
     * Имя и дата пишутся после него и только если их передали.
     */
    public NaryadCreatedDto create(NaryadCreateRequest request) {
        if (request == null || request.getOwnerNar() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadListCommandRules.BRIGADE_REQUIRED);
        }
        String name = NaryadListCommandRules.optionalName(request.getNameNar());
        LocalDateTime begDate = NaryadListCommandRules.optionalBegDate(request.getBegDate());
        String username = requireUsername();
        int authorId = requireUserId(username);
        if (!brigadeAllowed(username, request.getOwnerNar())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, NaryadListCommandRules.BRIGADE_FORBIDDEN);
        }
        int id = callCreatenar(authorId, request.getOwnerNar());
        try {
            if (name != null) {
                jdbc.update(
                        UPDATE_NAME_SQL,
                        new MapSqlParameterSource("nm", name).addValue("id", id));
            }
            if (begDate != null) {
                jdbc.update(
                        UPDATE_BEGDATE_SQL,
                        new MapSqlParameterSource("begdate", Timestamp.valueOf(begDate)).addValue("id", id));
                callSetDate(id);
            }
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
        return new NaryadCreatedDto(id);
    }

    /**
     * Удаляет один видимый наряд. Закрытое задание и закрытое выполнение запрещают удаление.
     */
    @Transactional
    public void delete(int id) {
        naryadListService.findHeader(id);
        ClosedFlags flags = loadClosedFlags(id);
        String refusal = NaryadListCommandRules.deleteRefusal(flags.zadanieClosed, flags.vipolnenieClosed);
        if (refusal != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, refusal);
        }
        MapSqlParameterSource params = new MapSqlParameterSource("id", id);
        try {
            for (String sql : DELETE_SQL) {
                jdbc.update(sql, params);
            }
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, NaryadProcedureMessages.from(ex));
        }
    }

    private List<BrigadeDto> queryBrigades(String sql, MapSqlParameterSource params) {
        return jdbc.query(sql, params, (rs, rowNum) -> new BrigadeDto(rs.getInt("id"), rs.getString("nm")));
    }

    private boolean brigadeAllowed(String username, int owner) {
        MapSqlParameterSource params = new MapSqlParameterSource("owner", owner);
        String sql;
        if (orgAccessService.isAdmin(username)) {
            sql = "SELECT COUNT(*) FROM (" + BRIGADE_SELECT + "AND t.key = :owner) allowed";
        } else {
            Optional<Integer> orgId = orgAccessService.resolveUserOrgId(username);
            if (orgId.isEmpty()) {
                return false;
            }
            params.addValue("aclUserOrgId", orgId.get());
            sql = "SELECT COUNT(*) FROM (" + BRIGADE_SELECT + BRIGADE_SUBTREE + "AND t.key = :owner) allowed";
        }
        Number count = jdbc.queryForObject(sql, params, Number.class);
        return count != null && count.intValue() > 0;
    }

    private int callCreatenar(int authorId, int owner) {
        int[] created = new int[1];
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall(CREATE_SQL)) {
                cs.setInt(1, DRILLING_NARTYPE);
                cs.setInt(2, owner);
                cs.setInt(3, authorId);
                cs.setNull(4, Types.NUMERIC);
                cs.registerOutParameter(4, Types.NUMERIC);
                cs.execute();
                BigDecimal result = cs.getBigDecimal(4);
                if (result == null) {
                    throw new SQLException("createnar не вернул код наряда");
                }
                created[0] = result.intValueExact();
            }
        });
        return created[0];
    }

    private void callSetDate(int id) {
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall(SET_DATE_SQL)) {
                cs.setInt(1, id);
                cs.execute();
            }
        });
    }

    private int requireUserId(String username) {
        List<Integer> ids = jdbc.query(
                USER_ID_SQL,
                new MapSqlParameterSource("username", username),
                (rs, rowNum) -> rs.getInt("users_id"));
        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadListCommandRules.USER_NOT_FOUND);
        }
        return ids.get(0);
    }

    private ClosedFlags loadClosedFlags(int id) {
        List<ClosedFlags> rows = jdbc.query(
                CLOSED_SQL,
                new MapSqlParameterSource("id", id),
                (rs, rowNum) -> new ClosedFlags(closedFlag(rs.getObject("zadanie_closed")),
                        closedFlag(rs.getObject("vipolnenie_closed"))));
        return rows.isEmpty() ? new ClosedFlags(null, null) : rows.get(0);
    }

    private static Boolean closedFlag(Object value) {
        if (value == null) {
            return null;
        }
        int number = value instanceof Number numeric
                ? numeric.intValue()
                : Integer.parseInt(value.toString());
        return number == 1;
    }

    private static String requireUsername() {
        String username = currentUsername();
        if (!StringUtils.hasText(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NaryadListCommandRules.USER_NOT_FOUND);
        }
        return username;
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }

    private static final class ClosedFlags {
        private final Boolean zadanieClosed;
        private final Boolean vipolnenieClosed;

        private ClosedFlags(Boolean zadanieClosed, Boolean vipolnenieClosed) {
            this.zadanieClosed = zadanieClosed;
            this.vipolnenieClosed = vipolnenieClosed;
        }
    }
}
