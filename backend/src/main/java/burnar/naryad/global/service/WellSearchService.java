package burnar.naryad.global.service;

import burnar.naryad.global.dto.WellSearchRowDto;
import burnar.naryad.shared.service.NaryadAutocommit;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/** Поиск скважины и загрузка справочника по техместу. */
@Service
public class WellSearchService {

    private final NamedParameterJdbcTemplate jdbc;
    private final NaryadAutocommit autocommit;

    public WellSearchService(NamedParameterJdbcTemplate jdbc, NaryadAutocommit autocommit) {
        this.jdbc = jdbc;
        this.autocommit = autocommit;
    }

    public List<WellSearchRowDto> search(
            String skv, String mest, String kust, String tehmesto, BigDecimal currentWellId, boolean ready) {
        if (!ready) {
            return List.of();
        }
        WellSearch.Filters filters = WellSearch.filters(skv, mest, kust, tehmesto);
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (filters.skvPrefix() != null) {
            params.addValue("skv", filters.skvPrefix());
        }
        if (filters.mestContains() != null) {
            params.addValue("mest", filters.mestContains());
        }
        if (filters.kustPrefix() != null) {
            params.addValue("kust", filters.kustPrefix());
        }
        if (filters.tehmestoPrefix() != null) {
            params.addValue("tehmesto", filters.tehmestoPrefix());
        }
        List<WellSearchRowDto> found = jdbc.query(
                WellSearch.searchSql(filters),
                params,
                (rs, rowNum) -> new WellSearchRowDto(
                        null,
                        null,
                        decimal(rs, "well_id"),
                        rs.getString("well_nm"),
                        rs.getString("well_label"),
                        decimal(rs, "kust_id"),
                        rs.getString("kust_nm"),
                        rs.getString("kust_label"),
                        decimal(rs, "mest_id"),
                        rs.getString("mest_nm"),
                        rs.getString("tehmesto")));
        List<WellSearchRowDto> rows = new ArrayList<>(found.size());
        for (int i = 0; i < found.size(); i++) {
            WellSearchRowDto row = found.get(i);
            rows.add(new WellSearchRowDto(
                    WellSearch.rowKey(row.getWellId(), row.getKustId(), row.getMestId(), i),
                    WellSearch.rowNumber(row.getWellId(), currentWellId, i),
                    row.getWellId(),
                    row.getWellNm(),
                    row.getWellLabel(),
                    row.getKustId(),
                    row.getKustNm(),
                    row.getKustLabel(),
                    row.getMestId(),
                    row.getMestNm(),
                    row.getTehmesto()));
        }
        return rows;
    }

    /**
     * {@code public.getkustwell} сама выполняет COMMIT, поэтому соединение
     * с autocommit и вне транзакции Spring.
     */
    public void refresh(String tehmesto) {
        String value = WellSearch.refreshTehmesto(tehmesto);
        autocommit.runMapped(con -> {
            try (CallableStatement cs = con.prepareCall("CALL public.getkustwell(?)")) {
                cs.setString(1, value);
                cs.execute();
            }
        });
    }

    private static BigDecimal decimal(ResultSet rs, String column) throws SQLException {
        BigDecimal value = rs.getBigDecimal(column);
        return rs.wasNull() ? null : value;
    }
}
