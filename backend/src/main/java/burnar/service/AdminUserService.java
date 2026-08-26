package burnar.service;

import burnar.dto.AdminUserDetailDto;
import burnar.dto.AdminUserDto;
import burnar.dto.AdminUserWriteRequest;
import burnar.dto.IdResponse;
import burnar.dto.ResponsiblePersonCreateRequest;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Date;
import java.sql.Types;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Админ-панель пользователей (Delphi formUsersDoljn, учётки).
 * Read: people + LEFT JOIN users; Write: people_add / UPDATE people + add_user.
 * Пароль хешируется bcrypt здесь и уходит в add_user как есть (без get_hash).
 */
@Service
public class AdminUserService {

    /** Тот же FROM, что у списка ответственных лиц (strUser без чекбоксов). */
    private static final String PEOPLE_FROM =
            "FROM burnar.karjera k "
                    + "JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                    + "JOIN burnar.people p ON p.id = k.idpeople "
                    + "LEFT JOIN burnar.users u ON u.people_id = p.id ";

    private static final String USER_SELECT =
            "p.id, "
                    + "u.users_id, "
                    + "p.fio, "
                    + "u.ora_name, "
                    + "u.active, "
                    + "to_char(u.dtenter, 'YYYY-MM-DD') AS dtenter, "
                    + "to_char(u.dtout, 'YYYY-MM-DD') AS dtout, "
                    + "u.note ";

    private static final String DETAIL_SELECT =
            USER_SELECT + ", p.fioreports, p.fiorodpad ";

    private static final RowMapper<AdminUserDto> LIST_MAPPER = (rs, rowNum) -> {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(rs.getInt("id"));
        dto.setUsersId((Integer) rs.getObject("users_id"));
        dto.setFio(rs.getString("fio"));
        dto.setOraName(rs.getString("ora_name"));
        Number active = (Number) rs.getObject("active");
        dto.setActive(active == null ? null : active.intValue());
        dto.setDtEnter(rs.getString("dtenter"));
        dto.setDtOut(rs.getString("dtout"));
        dto.setNote(rs.getString("note"));
        return dto;
    };

    private static final RowMapper<AdminUserDetailDto> DETAIL_MAPPER = (rs, rowNum) -> {
        AdminUserDetailDto dto = new AdminUserDetailDto();
        dto.setId(rs.getInt("id"));
        dto.setUsersId((Integer) rs.getObject("users_id"));
        dto.setFio(rs.getString("fio"));
        dto.setFioreports(rs.getString("fioreports"));
        dto.setFiorodpad(rs.getString("fiorodpad"));
        dto.setOraName(rs.getString("ora_name"));
        Number active = (Number) rs.getObject("active");
        dto.setActive(active == null ? null : active.intValue());
        dto.setDtEnter(rs.getString("dtenter"));
        dto.setDtOut(rs.getString("dtout"));
        dto.setNote(rs.getString("note"));
        return dto;
    };

    /** Дефолт Delphi/админки, если логин задан, а пароль на форме пустой. */
    private static final String DEFAULT_PASSWORD = "123";

    private final NamedParameterJdbcTemplate jdbc;
    private final OrgAccessService orgAccessService;
    private final ResponsiblePersonService responsiblePersonService;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(
            NamedParameterJdbcTemplate jdbc,
            OrgAccessService orgAccessService,
            ResponsiblePersonService responsiblePersonService,
            PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.orgAccessService = orgAccessService;
        this.responsiblePersonService = responsiblePersonService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Pageable-список людей с полями учётки (как admin-grid Delphi).
     * Колоночные фильтры BaseTable: id, fio, oraName, note.
     * Чекбоксы: accountKind (responsible|users), activeKind (active|inactive).
     * orgUnitId — админский cut parent-поддерева (как у ответственных лиц; «Все» = null).
     */
    public Page<AdminUserDto> findUsers(
            Pageable pageable,
            String id,
            String fio,
            String oraName,
            String note,
            String accountKind,
            String activeKind,
            Integer orgUnitId) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        String username = currentUsername();
        if (!orgAccessService.appendOrgParentSubtreeFilter(
                where, params, username, orgUnitId, "ds.org")) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        AdminUserListFilters.appendAccountKind(where, accountKind);
        AdminUserListFilters.appendActiveKind(where, activeKind);

        appendTextFilter(where, params, "id", id,
                "CAST(p.id AS varchar) ILIKE CONCAT(:id, '%')");
        appendTextFilter(where, params, "fio", fio,
                "p.fio ILIKE CONCAT('%', :fio, '%')");
        appendTextFilter(where, params, "oraName", oraName,
                "u.ora_name ILIKE CONCAT('%', :oraName, '%')");
        appendTextFilter(where, params, "note", note,
                "u.note ILIKE CONCAT('%', :note, '%')");

        String countSql = "SELECT COUNT(*) FROM ("
                + "SELECT DISTINCT p.id " + PEOPLE_FROM + where
                + ") t";
        Long total = jdbc.queryForObject(countSql, params, Long.class);
        if (total == null) {
            total = 0L;
        }

        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());

        String listSql = "SELECT DISTINCT " + USER_SELECT
                + PEOPLE_FROM + where
                + "ORDER BY p.fio "
                + "LIMIT :limit OFFSET :offset";
        List<AdminUserDto> content = jdbc.query(listSql, params, LIST_MAPPER);
        return new PageImpl<>(content, pageable, total);
    }

    /** Карточка для формы справа; 404 если человек вне ACL. */
    public AdminUserDetailDto getUser(int peopleId) {
        if (!isPersonVisible(peopleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        List<AdminUserDetailDto> rows = jdbc.query(
                "SELECT " + DETAIL_SELECT
                        + "FROM burnar.people p "
                        + "LEFT JOIN burnar.users u ON u.people_id = p.id "
                        + "WHERE p.id = :id",
                new MapSqlParameterSource("id", peopleId),
                DETAIL_MAPPER);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return rows.get(0);
    }

    /**
     * Новый человек + стартовая карьера; учётка — только если логин непустой.
     * Без логина остаётся ответственным лицом, add_user не вызываем.
     */
    @Transactional
    public IdResponse createUser(AdminUserWriteRequest req) {
        if (req == null || !StringUtils.hasText(req.getFio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fio is required");
        }
        ResponsiblePersonCreateRequest person = new ResponsiblePersonCreateRequest();
        person.setFio(req.getFio());
        person.setFioreports(req.getFioreports());
        person.setFiorodpad(req.getFiorodpad());
        person.setDateIn(req.getDateIn());
        person.setOrgId(req.getOrgId());
        person.setDoljId(req.getDoljId());
        IdResponse created = responsiblePersonService.createPerson(person);
        maybeAddUser(created.getId(), req, true);
        return created;
    }

    /**
     * Сохраняет ФИО выбранного и при непустом логине создаёт/обновляет учётку.
     * tabn не трогаем — его нет в админ-форме (в отличие от ResponsiblePersonService.updatePerson).
     */
    @Transactional
    public void updateUser(int peopleId, AdminUserWriteRequest req) {
        AdminUserDetailDto current = getUser(peopleId);
        if (req == null || !StringUtils.hasText(req.getFio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "fio is required");
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id", peopleId)
                .addValue("fio", req.getFio().trim())
                .addValue("fioreports", blankToNull(req.getFioreports()))
                .addValue("fiorodpad", blankToNull(req.getFiorodpad()));
        int updated = jdbc.update(
                "UPDATE burnar.people SET fio = :fio, fioreports = :fioreports, "
                        + "fiorodpad = :fiorodpad WHERE id = :id",
                params);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        boolean creatingAccount = current.getUsersId() == null;
        maybeAddUser(peopleId, req, creatingAccount);
    }

    private void maybeAddUser(int peopleId, AdminUserWriteRequest req, boolean creatingAccount) {
        String oraName = blankToNull(req.getOraName());
        if (oraName == null) {
            return;
        }
        String passwordHash = creatingAccount
                ? hashForNewAccount(req.getPassword())
                : hashForExistingAccount(req.getPassword());
        int active = Boolean.TRUE.equals(req.getActive()) ? 1 : 0;
        try {
            jdbc.getJdbcTemplate().execute((Connection con) -> {
                callAddUser(
                        con,
                        peopleId,
                        parseOptionalDate(req.getDtEnter(), "dtEnter"),
                        parseOptionalDate(req.getDtOut(), "dtOut"),
                        active,
                        blankToNull(req.getNote()),
                        oraName,
                        passwordHash);
                return null;
            });
        } catch (DataAccessException e) {
            rethrowAddUserConflict(e);
            throw e;
        }
    }

    private String hashForNewAccount(String password) {
        String plain = StringUtils.hasText(password) ? password : DEFAULT_PASSWORD;
        return passwordEncoder.encode(plain);
    }

    private String hashForExistingAccount(String password) {
        if (!StringUtils.hasText(password)) {
            return null;
        }
        return passwordEncoder.encode(password);
    }

    private static void callAddUser(
            Connection con,
            int peopleId,
            LocalDate dtEnter,
            LocalDate dtOut,
            int active,
            String note,
            String username,
            String passwordHash) throws java.sql.SQLException {
        // PostgreSQL PROCEDURE — только нативный CALL; JDBC {call …} уходит как function.
        // p_password уже bcrypt (или null на UPDATE без смены пароля); get_hash в процедуре не вызывается.
        try (CallableStatement cs = con.prepareCall(
                "CALL burnar.add_user(?, ?, ?, ?, ?, ?, ?, ?)")) {
            cs.setBigDecimal(1, BigDecimal.valueOf(peopleId));
            cs.setNull(2, Types.NUMERIC);
            if (dtEnter != null) {
                cs.setDate(3, Date.valueOf(dtEnter));
            } else {
                cs.setNull(3, Types.DATE);
            }
            if (dtOut != null) {
                cs.setDate(4, Date.valueOf(dtOut));
            } else {
                cs.setNull(4, Types.DATE);
            }
            cs.setBigDecimal(5, BigDecimal.valueOf(active));
            if (note != null) {
                cs.setString(6, note);
            } else {
                cs.setNull(6, Types.VARCHAR);
            }
            cs.setString(7, username);
            if (passwordHash != null) {
                cs.setString(8, passwordHash);
            } else {
                cs.setNull(8, Types.VARCHAR);
            }
            cs.execute();
        }
    }

    private static void rethrowAddUserConflict(DataAccessException e) {
        Throwable cause = e;
        while (cause != null) {
            String msg = cause.getMessage();
            if (msg != null && msg.contains("-20001")) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "Логин уже используется другим пользователем!");
            }
            if (msg != null && msg.contains("-20002")) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "У пользователя уже создан другой логин!");
            }
            cause = cause.getCause();
        }
    }

    private static LocalDate parseOptionalDate(String value, String field) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be yyyy-MM-dd");
        }
    }

    private static String blankToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private boolean isPersonVisible(int peopleId) {
        MapSqlParameterSource params = new MapSqlParameterSource("peopleId", peopleId);
        StringBuilder where = new StringBuilder("WHERE p.id = :peopleId ");
        String username = currentUsername();
        if (!orgAccessService.appendOrgParentSubtreeFilter(
                where, params, username, null, "ds.org")) {
            return false;
        }
        String sql = "SELECT COUNT(*) FROM ("
                + "SELECT DISTINCT p.id " + PEOPLE_FROM + where
                + ") t";
        Long n = jdbc.queryForObject(sql, params, Long.class);
        return n != null && n > 0;
    }

    private static void appendTextFilter(
            StringBuilder where,
            MapSqlParameterSource params,
            String paramName,
            String value,
            String condition) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        params.addValue(paramName, value.trim());
        where.append("AND ").append(condition).append(' ');
    }

    private static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }
}
