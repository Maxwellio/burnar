package burnar.service;

import burnar.dto.NaryadRowColorDto;
import burnar.dto.NaryadRowsColorDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Цвет строк дерева задания и выполнения. Обычный UPDATE, без процедур с COMMIT,
 * поэтому запись и блокировка описателя идут одной транзакцией.
 */
@Service
public class NaryadRowColorService {

    static final String UPDATE_ZADANIE_COLOR_SQL =
            "UPDATE burnar.zadanie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    static final String UPDATE_VIPOLNENIE_COLOR_SQL =
            "UPDATE burnar.vipolnenie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key = :nodeId";

    static final String UPDATE_ZADANIE_COLORS_SQL =
            "UPDATE burnar.zadanie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key IN (:nodeIds)";

    static final String UPDATE_VIPOLNENIE_COLORS_SQL =
            "UPDATE burnar.vipolnenie_oper SET colorsel = :color "
                    + "WHERE narkey = :narkey AND key IN (:nodeIds)";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;
    private final NaryadPartAccess partAccess;

    public NaryadRowColorService(
            NamedParameterJdbcTemplate jdbc,
            NaryadListService naryadListService,
            NaryadPartAccess partAccess) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
        this.partAccess = partAccess;
    }

    @Transactional
    public NaryadRowColorDto updateZadanieColor(int naryadId, long nodeId, Integer color) {
        return updateColor(naryadId, nodeId, color, true, UPDATE_ZADANIE_COLOR_SQL);
    }

    @Transactional
    public NaryadRowColorDto updateVipolnenieColor(int naryadId, long nodeId, Integer color) {
        return updateColor(naryadId, nodeId, color, false, UPDATE_VIPOLNENIE_COLOR_SQL);
    }

    @Transactional
    public NaryadRowsColorDto updateZadanieColors(int naryadId, Integer color, List<Long> nodeIds) {
        return updateColors(naryadId, color, nodeIds, true, UPDATE_ZADANIE_COLORS_SQL);
    }

    @Transactional
    public NaryadRowsColorDto updateVipolnenieColors(int naryadId, Integer color, List<Long> nodeIds) {
        return updateColors(naryadId, color, nodeIds, false, UPDATE_VIPOLNENIE_COLORS_SQL);
    }

    private NaryadRowColorDto updateColor(
            int naryadId, long nodeId, Integer color, boolean zadanie, String updateSql) {
        naryadListService.findHeader(naryadId);
        int validColor = NaryadOperFormat.requireValidColor(color);
        if (partAccess.readClosed(zadanie, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("nodeId", nodeId)
                .addValue("color", validColor);
        if (jdbc.update(updateSql, params) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return new NaryadRowColorDto(nodeId, validColor);
    }

    private NaryadRowsColorDto updateColors(
            int naryadId, Integer color, List<Long> nodeIds, boolean zadanie, String updateSql) {
        naryadListService.findHeader(naryadId);
        int validColor = NaryadOperFormat.requireValidColor(color);
        List<Long> ids = NaryadOperFormat.requireNodeIds(nodeIds);
        if (partAccess.readClosed(zadanie, naryadId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Naryad part is closed");
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("narkey", naryadId)
                .addValue("nodeIds", ids)
                .addValue("color", validColor);
        if (jdbc.update(updateSql, params) != ids.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        return new NaryadRowsColorDto(validColor, ids);
    }
}
