package burnar.service;

import burnar.dto.NaryadOcardFileDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

/**
 * Имена оперкарт текущей строки. Запрос объединяет основной источник
 * operlife.osnoventer1 и источники строки (zadanie_ist / vipolnenie_ist):
 * пустой один из них не прячет файл второго, несколько источников не роняют выборку.
 */
@Service
public class OcardService {

    static final String ZADANIE_NODE_SQL =
            "SELECT 1 FROM burnar.zadanie_oper o WHERE o.key = :nodeId AND o.narkey = :naryadId";

    static final String VIPOLNENIE_NODE_SQL =
            "SELECT 1 FROM burnar.vipolnenie_oper o WHERE o.key = :nodeId AND o.narkey = :naryadId";

    static final String ZADANIE_FILES_SQL =
            "SELECT DISTINCT btrim(i.lnkfile) AS lnkfile "
                    + "FROM public.istochniki i "
                    + "WHERE i.lnkfile IS NOT NULL AND btrim(i.lnkfile) <> '' "
                    + "AND (i.id = (SELECT op.osnoventer1 FROM public.operlife op "
                    + "              WHERE op.id = (SELECT o.operlifeid FROM burnar.zadanie_oper o "
                    + "                             WHERE o.key = :nodeId AND o.narkey = :naryadId)) "
                    + "     OR i.id IN (SELECT z.ist FROM burnar.zadanie_ist z WHERE z.zad_key = :nodeId)) "
                    + "ORDER BY 1";

    static final String VIPOLNENIE_FILES_SQL =
            "SELECT DISTINCT btrim(i.lnkfile) AS lnkfile "
                    + "FROM public.istochniki i "
                    + "WHERE i.lnkfile IS NOT NULL AND btrim(i.lnkfile) <> '' "
                    + "AND (i.id = (SELECT op.osnoventer1 FROM public.operlife op "
                    + "              WHERE op.id = (SELECT o.operlifeid FROM burnar.vipolnenie_oper o "
                    + "                             WHERE o.key = :nodeId AND o.narkey = :naryadId)) "
                    + "     OR i.id IN (SELECT v.ist FROM burnar.vipolnenie_ist v WHERE v.vip_key = :nodeId)) "
                    + "ORDER BY 1";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;

    public OcardService(NamedParameterJdbcTemplate jdbc, NaryadListService naryadListService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
    }

    public List<NaryadOcardFileDto> zadanieFiles(int naryadId, long nodeId) {
        return files(true, naryadId, nodeId);
    }

    public List<NaryadOcardFileDto> vipolnenieFiles(int naryadId, long nodeId) {
        return files(false, naryadId, nodeId);
    }

    /** Та же выборка, что у списка файлов: кнопка включается, только если карта есть. */
    public boolean hasCard(boolean zadanie, int naryadId, long nodeId) {
        return !safeNames(zadanie, naryadId, nodeId).isEmpty();
    }

    private List<NaryadOcardFileDto> files(boolean zadanie, int naryadId, long nodeId) {
        naryadListService.findHeader(naryadId);
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("naryadId", naryadId)
                .addValue("nodeId", nodeId);
        List<Integer> found = jdbc.query(
                zadanie ? ZADANIE_NODE_SQL : VIPOLNENIE_NODE_SQL,
                params,
                (rs, rowNum) -> rs.getInt(1));
        if (found.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Naryad row not found");
        }
        List<NaryadOcardFileDto> files = new ArrayList<>();
        for (String name : safeNames(zadanie, naryadId, nodeId)) {
            files.add(new NaryadOcardFileDto(name));
        }
        return files;
    }

    private List<String> safeNames(boolean zadanie, int naryadId, long nodeId) {
        List<String> names = jdbc.query(
                zadanie ? ZADANIE_FILES_SQL : VIPOLNENIE_FILES_SQL,
                new MapSqlParameterSource()
                        .addValue("naryadId", naryadId)
                        .addValue("nodeId", nodeId),
                (rs, rowNum) -> rs.getString("lnkfile"));
        List<String> safe = new ArrayList<>();
        for (String name : names) {
            if (name == null || name.isBlank()) {
                continue;
            }
            try {
                safe.add(OcardStorage.safeFileName(name));
            } catch (ResponseStatusException ignored) {
                // Имя из базы с путём или чужим расширением в ссылку не кладём.
            }
        }
        return safe;
    }
}
