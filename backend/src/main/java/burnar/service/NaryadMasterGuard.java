package burnar.service;

import burnar.dto.DeleteBlockDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Блокирует удаление человека/карьеры, если по логике burnar.getmasters
 * человек указан мастером хотя бы одного наряда (включая закрытые, любой nartype).
 * Мастер не хранится ссылкой: карьера на дату создания наряда совпадает
 * с должностью командира бригады (spr_workers.boss) в той же орг. единице.
 */
@Service
public class NaryadMasterGuard {

    static final String PERSON_BLOCK_MESSAGE =
            "Нельзя удалить пользователя, пока он указан как мастер в наряде";
    static final String CAREER_BLOCK_MESSAGE =
            "Нельзя удалить карьеру, пока пользователь указан как мастер в наряде";

    /**
     * Те же JOIN/условия, что у getmasters, без фильтра nartype и без отсечения closed.
     * :careerKey опционален — для проверки конкретной карьеры.
     */
    private static final String MASTER_COUNT_SQL =
            "SELECT COUNT(*) FROM burnar.defnar def "
                    + "INNER JOIN burnar.spr_workers w ON w.key = def.ownernar "
                    + "INNER JOIN burnar.karjera k ON k.idpeople = :peopleId "
                    + "INNER JOIN burnar.doljtostruct ds ON ds.key = k.doljinstru "
                    + "WHERE k.dtenter <= def.createdate "
                    + "AND k.dtout >= def.createdate "
                    + "AND ds.org = w.org "
                    + "AND w.boss = ds.doljnost "
                    + "%s";

    private final NamedParameterJdbcTemplate jdbc;

    public NaryadMasterGuard(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public DeleteBlockDto personDeleteBlock(int peopleId) {
        return isListedAsMaster(peopleId, null)
                ? DeleteBlockDto.blocked(PERSON_BLOCK_MESSAGE)
                : DeleteBlockDto.allowed();
    }

    public DeleteBlockDto careerDeleteBlock(int peopleId, int careerKey) {
        return isListedAsMaster(peopleId, careerKey)
                ? DeleteBlockDto.blocked(CAREER_BLOCK_MESSAGE)
                : DeleteBlockDto.allowed();
    }

    public void rejectIfPersonIsMaster(int peopleId) {
        if (isListedAsMaster(peopleId, null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, PERSON_BLOCK_MESSAGE);
        }
    }

    public void rejectIfCareerHoldsMaster(int peopleId, int careerKey) {
        if (isListedAsMaster(peopleId, careerKey)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, CAREER_BLOCK_MESSAGE);
        }
    }

    private boolean isListedAsMaster(int peopleId, Integer careerKey) {
        MapSqlParameterSource params = new MapSqlParameterSource("peopleId", peopleId);
        String careerFilter = "";
        if (careerKey != null) {
            params.addValue("careerKey", careerKey);
            careerFilter = "AND k.key = :careerKey ";
        }
        Long found = jdbc.queryForObject(
                String.format(MASTER_COUNT_SQL, careerFilter),
                params,
                Long.class);
        return found != null && found > 0L;
    }
}
