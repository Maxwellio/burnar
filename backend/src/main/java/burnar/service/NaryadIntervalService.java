package burnar.service;

import burnar.dto.NaryadIntervalRowDto;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * Проверка непрерывности интервалов, {@code actIntervals}.
 * Списки и цвет строки считают те же запросы, что гриды {@code TfrmMehBurIntervals}.
 */
@Service
public class NaryadIntervalService {

    static final String MEH_SQL =
            "SELECT vo.key AS id, "
                    + "vo.prnum, "
                    + "max(so.nm) AS nm, "
                    + "max(CASE WHEN vp.parcode = 747 THEN vp.znach END) AS ot, "
                    + "max(CASE WHEN vp.parcode = 748 THEN vp.znach END) AS do_, "
                    + "burnar.getrabmehburintervals(d.key, vo.key) AS colorsel "
                    + "FROM burnar.defnar d "
                    + "JOIN burnar.vipolnenie_oper vo ON vo.narkey = d.key "
                    + "JOIN public.spr_oper so ON vo.oper = so.key "
                    + "JOIN burnar.vipolnenie_param vp ON vo.key = vp.vip_key "
                    + "WHERE d.key = :narkey "
                    + "AND vo.operlifetypeoper = 203 "
                    + "AND vp.parcode IN (747, 748) "
                    + "GROUP BY d.key, vo.key, vo.prnum "
                    + "ORDER BY ot, vo.prnum";

    static final String NAR_SQL =
            "SELECT vo.key AS id, "
                    + "vo.prnum, "
                    + "max(so.nm) AS nm, "
                    + "max(CASE WHEN vp.parcode = 747 THEN vp.znach "
                    + "WHEN vp.parcode = 1073 THEN vp.znach END) AS ot, "
                    + "max(CASE WHEN vp.parcode = 748 THEN vp.znach "
                    + "WHEN vp.parcode = 1074 THEN vp.znach END) AS do_, "
                    + "burnar.getrabnarintervals(d.key, vo.key) AS colorsel "
                    + "FROM burnar.defnar d "
                    + "JOIN burnar.vipolnenie_oper vo ON vo.narkey = d.key "
                    + "JOIN public.spr_oper so ON vo.oper = so.key "
                    + "JOIN burnar.vipolnenie_param vp ON vo.key = vp.vip_key "
                    + "WHERE d.key = :narkey "
                    + "AND vo.operlifetypeoper = 213 "
                    + "AND vp.parcode IN (747, 748, 1073, 1074) "
                    + "GROUP BY d.key, vo.key, vo.prnum "
                    + "ORDER BY ot, vo.prnum";

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadListService naryadListService;

    public NaryadIntervalService(NamedParameterJdbcTemplate jdbc, NaryadListService naryadListService) {
        this.jdbc = jdbc;
        this.naryadListService = naryadListService;
    }

    public List<NaryadIntervalRowDto> mehbur(int naryadId) {
        return list(naryadId, MEH_SQL);
    }

    public List<NaryadIntervalRowDto> narashchivanie(int naryadId) {
        return list(naryadId, NAR_SQL);
    }

    static Integer colorCode(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof BigDecimal decimal) {
            return decimal.intValue();
        }
        String text = raw.toString().trim();
        if (text.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(text).intValue();
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private List<NaryadIntervalRowDto> list(int naryadId, String sql) {
        naryadListService.findHeader(naryadId);
        return jdbc.query(sql, new MapSqlParameterSource("narkey", naryadId), (rs, rowNum) -> mapRow(rs));
    }

    private static NaryadIntervalRowDto mapRow(ResultSet rs) throws SQLException {
        return new NaryadIntervalRowDto(
                rs.getLong("id"),
                rs.getBigDecimal("prnum"),
                rs.getString("nm"),
                rs.getBigDecimal("ot"),
                rs.getBigDecimal("do_"),
                colorCode(rs.getString("colorsel")));
    }
}
