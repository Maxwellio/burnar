package burnar.service;

import burnar.dto.IdResponse;
import burnar.dto.PositionDto;
import burnar.dto.PositionWriteRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;

/**
 * CRUD справочника должностей (Delphi SprDolj_list → burnar.sprdoljnost).
 * Прямой SQL: процедур IUD в БД нет. key выдаёт триггер ftrg_sprdoljnost_ins_before;
 * rank не пишем. Вызывается только из PositionAdminController (/api/admin/positions).
 * Удаление чистит неиспользуемые строки doljtostruct этой должности (сироты после
 * удаления/смены карьер), иначе FK fk_dolj блокирует sprdoljnost.
 */
@Service
public class PositionAdminService {

    private static final int NM_MAX_LEN = 70;

    private static final RowMapper<PositionDto> MAPPER = (rs, rowNum) -> {
        PositionDto dto = new PositionDto();
        dto.setId(rs.getInt("id"));
        dto.setNm(rs.getString("nm"));
        return dto;
    };

    private final NamedParameterJdbcTemplate jdbc;

    public PositionAdminService(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Pageable-список для BaseTable. Колоночные фильтры: id, nm.
     * Сортировка как в Delphi qrySpr_typ — по коду.
     */
    public Page<PositionDto> findPositions(Pageable pageable, String id, String nm) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        appendTextFilter(where, params, "id", id,
                "CAST(s.\"key\" AS varchar) ILIKE CONCAT(:id, '%')");
        appendTextFilter(where, params, "nm", nm,
                "s.nm ILIKE CONCAT('%', :nm, '%')");

        String countSql = "SELECT COUNT(*) FROM burnar.sprdoljnost s " + where;
        Long total = jdbc.queryForObject(countSql, params, Long.class);
        if (total == null) {
            total = 0L;
        }
        if (total == 0L) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        params.addValue("limit", pageable.getPageSize());
        params.addValue("offset", pageable.getOffset());
        String listSql = "SELECT s.\"key\" AS id, s.nm FROM burnar.sprdoljnost s "
                + where
                + "ORDER BY s.\"key\" "
                + "LIMIT :limit OFFSET :offset";
        List<PositionDto> content = jdbc.query(listSql, params, MAPPER);
        return new PageImpl<>(content, pageable, total);
    }

    /** Карточка для формы редактирования. */
    public PositionDto getPosition(int id) {
        List<PositionDto> rows = jdbc.query(
                "SELECT s.\"key\" AS id, s.nm FROM burnar.sprdoljnost s WHERE s.\"key\" = :id",
                new MapSqlParameterSource("id", id),
                MAPPER);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Должность не найдена");
        }
        return rows.get(0);
    }

    @Transactional
    public IdResponse createPosition(PositionWriteRequest body) {
        String nm = requireNm(body);
        Integer newId = jdbc.queryForObject(
                "INSERT INTO burnar.sprdoljnost (nm) VALUES (:nm) RETURNING \"key\"",
                new MapSqlParameterSource("nm", nm),
                Integer.class);
        if (newId == null) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Не удалось создать должность");
        }
        return new IdResponse(newId);
    }

    @Transactional
    public void updatePosition(int id, PositionWriteRequest body) {
        String nm = requireNm(body);
        int updated = jdbc.update(
                "UPDATE burnar.sprdoljnost SET nm = :nm WHERE \"key\" = :id",
                new MapSqlParameterSource()
                        .addValue("id", id)
                        .addValue("nm", nm));
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Должность не найдена");
        }
    }

    /**
     * Удаление sprdoljnost. Карьеры (включая закрытые) и spr_workers.boss блокируют.
     * Сироты doljtostruct этой должности снимаются, иначе FK fk_dolj не даёт удалить
     * справочник после удаления/смены карьер. Триггер в bd_bur чистит сироты на лету;
     * здесь страховка для уже накопившихся строк и на случай, если триггер ещё не накатили.
     */
    @Transactional
    public void deletePosition(int id) {
        MapSqlParameterSource idParam = new MapSqlParameterSource("id", id);
        Long exists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM burnar.sprdoljnost WHERE \"key\" = :id",
                idParam,
                Long.class);
        if (exists == null || exists == 0L) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Должность не найдена");
        }

        Long careerCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM burnar.karjera k "
                        + "JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                        + "WHERE ds.doljnost = :id",
                idParam,
                Long.class);
        if (careerCount != null && careerCount > 0L) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Нельзя удалить должность: она указана в карьере пользователя");
        }

        Long workersCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM burnar.spr_workers WHERE boss = :id",
                idParam,
                Long.class);
        if (workersCount != null && workersCount > 0L) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Нельзя удалить должность: она назначена командиром бригады");
        }

        try {
            jdbc.update(
                    "UPDATE burnar.doljtostruct SET boss = NULL "
                            + "WHERE boss IN ("
                            + "SELECT key FROM ("
                            + "SELECT ds.key FROM burnar.doljtostruct ds WHERE ds.doljnost = :id"
                            + ") t)",
                    idParam);
            jdbc.update(
                    "DELETE FROM burnar.doljtostruct WHERE doljnost = :id",
                    idParam);
            jdbc.update(
                    "DELETE FROM burnar.sprdoljnost WHERE \"key\" = :id",
                    idParam);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Нельзя удалить должность: она используется",
                    ex);
        }
    }

    private static String requireNm(PositionWriteRequest body) {
        if (body == null || !StringUtils.hasText(body.getNm())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Укажите наименование должности");
        }
        String nm = body.getNm().trim();
        if (nm.length() > NM_MAX_LEN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Наименование не длиннее 70 символов");
        }
        return nm;
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
}
